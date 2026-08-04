const API_BASE = '/api/nest';
const API_TIMEOUT = 30_000;
let refreshPromise: Promise<{ access_token: string; refresh_token?: string } | null> | null = null;

interface RequestOptions {
  method?: string;
  body?: Record<string, unknown> | unknown;
  token?: string | null;
  timeout?: number;
}

class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(typeof data.message === 'string' ? data.message : 'API request failed');
    this.status = status;
    this.data = data;
  }
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('Load failed')
    );
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  return false;
}

function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Request timed out. Server may be slow or unreachable.';
  }
  return 'Unable to connect to server. Please check your connection and try again.';
}

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, timeout = API_TIMEOUT } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const authToken = token ?? getToken();
  if (authToken != null) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (isNetworkError(error)) {
      throw new ApiError(0, { message: getNetworkErrorMessage(error) });
    }
    throw new ApiError(0, { message: 'An unexpected network error occurred.' });
  } finally {
    clearTimeout(timeoutId);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  const isPublicAuthEndpoint =
    endpoint === '/auth/login' ||
    endpoint === '/auth/register' ||
    endpoint === '/auth/forgot-password' ||
    endpoint === '/auth/reset-password';

  if (
    res.status === 401 &&
    !isPublicAuthEndpoint &&
    !endpoint.includes('/refresh') &&
    authToken != null
  ) {
    const storedRefreshToken = getRefreshToken();
    if (!refreshPromise && storedRefreshToken) {
      refreshPromise = (async () => {
        try {
          const refreshResult = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
            signal: AbortSignal.timeout(API_TIMEOUT),
          });
          if (refreshResult.ok) {
            const refreshData = await refreshResult.json();
            setToken(refreshData.access_token);
            if (refreshData.refresh_token) {
              setRefreshToken(refreshData.refresh_token);
            }
            return refreshData;
          }
          return null;
        } catch {
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }
    const refreshData = await refreshPromise;
    if (refreshData) {
      const retryRes = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshData.access_token}`,
        },
        credentials: 'include',
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        signal: AbortSignal.timeout(timeout),
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) {
        throw new ApiError(retryRes.status, retryData);
      }
      return retryData as T;
    }
    removeToken();
    removeRefreshToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function setToken(token: string) {
  localStorage.setItem('auth_token', token);
  setAuthCookie(token);
}

function removeToken() {
  localStorage.removeItem('auth_token');
  clearAuthCookie();
}

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth_token=; path=/; max-age=0';
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

function setRefreshToken(token: string) {
  localStorage.setItem('refresh_token', token);
}

function removeRefreshToken() {
  localStorage.removeItem('refresh_token');
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      request<{ user: any; access_token: string; refresh_token?: string }>('/auth/register', {
        method: 'POST',
        body: data,
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; access_token: string; refresh_token?: string }>('/auth/login', {
        method: 'POST',
        body: data,
      }),
    me: () => request<any>('/auth/me'),
    refresh: () => {
      const storedRefreshToken = getRefreshToken();
      return request<{ access_token: string; refresh_token?: string }>('/auth/refresh', {
        method: 'POST',
        body: storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
      });
    },
    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch {
        // clear tokens regardless of API response
      }
      removeToken();
      removeRefreshToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  },
  users: {
    updateEmail: (data: { email: string; currentPassword: string }) =>
      request<any>('/users/me/email', { method: 'PATCH', body: data }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<any>('/users/me/password', { method: 'PATCH', body: data }),
    deleteAccount: (currentPassword: string) =>
      request<any>('/users/me', { method: 'DELETE', body: { currentPassword } }),
  },
  profile: {
    get: () => request<any>('/profile'),
    update: (data: any) => request<any>('/profile', { method: 'PATCH', body: data }),
    updatePrivacy: (data: { privacySettings: string }) =>
      request<any>('/profile/privacy', { method: 'PATCH', body: data }),
    getCompletion: () =>
      request<{ percentage: number; missingFields: string[] }>('/profile/completion'),
    getSessions: () => request<any[]>('/profile/sessions'),
    claimUsername: (data: { username: string }) =>
      request<{ id: string; username: string; profileSlug: string }>('/profile/username', {
        method: 'POST',
        body: data,
      }),
    getFieldPrivacy: () => request<any>('/profile/privacy-fields'),
    updateFieldPrivacy: (fields: { fieldName: string; visibility: string }[]) =>
      request<any>('/profile/privacy-fields', {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      }),
    getSettings: () => request<any>('/profile/settings'),
    updateSettings: (data: { locale?: string; timezone?: string }) =>
      request<any>('/profile/settings', { method: 'PATCH', body: data }),
    getPublicProfile: (slug: string) => request<any>(`/profile/public/${slug}`),
    getPublicProfileById: (displayId: string) => request<any>(`/profile/public/by-id/${displayId}`),
    uploadAvatar: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = getToken();
      const res = await fetch(`${API_BASE}/profile/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(res.status, data);
      return data;
    },
    uploadCover: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = getToken();
      const res = await fetch(`${API_BASE}/profile/cover`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(res.status, data);
      return data;
    },
    removeAvatar: () => request<any>('/profile/avatar', { method: 'DELETE' }),
    removeCover: () => request<any>('/profile/cover', { method: 'DELETE' }),
  },
  families: {
    list: () => request<any[]>('/families'),
    get: (id: string) => request<any>(`/families/${id}`),
    create: (data: { name: string; description?: string }) =>
      request<any>('/families', { method: 'POST', body: data }),
    update: (id: string, data: { name?: string; description?: string }) =>
      request<any>(`/families/${id}`, { method: 'PATCH', body: data }),
    delete: (id: string) => request<any>(`/families/${id}`, { method: 'DELETE' }),
    stats: () =>
      request<{ totalFamilies: number; totalMembers: number; totalRelationships: number }>(
        '/families/stats',
      ),
    getLimit: () => request<{ used: number; limit: number | null }>('/families/limit'),
    searchMember: (displayId: string) => request<any>(`/families/search-member/${displayId}`),
  },
  members: {
    list: (familyId: string) => request<any[]>(`/families/${familyId}/members`),
    get: (familyId: string, memberId: string) =>
      request<any>(`/families/${familyId}/members/${memberId}`),
    create: (familyId: string, data: any) =>
      request<any>(`/families/${familyId}/members`, { method: 'POST', body: data }),
    update: (familyId: string, memberId: string, data: any) =>
      request<any>(`/families/${familyId}/members/${memberId}`, { method: 'PATCH', body: data }),
    delete: (familyId: string, memberId: string) =>
      request<any>(`/families/${familyId}/members/${memberId}`, { method: 'DELETE' }),
    checkDuplicate: (
      familyId: string,
      data: { firstName: string; lastName: string; birthDate?: string },
    ) =>
      request<{ duplicate: boolean; member: any }>(
        `/families/${familyId}/members/check-duplicate`,
        { method: 'POST', body: data },
      ),
    checkGlobalDuplicate: (data: any) =>
      request<{ hasDuplicates: boolean; duplicates: any[] }>(
        '/families/any/members/check-global-duplicate',
        { method: 'POST', body: data },
      ),
  },
  relationships: {
    list: (familyId: string) => request<any[]>(`/families/${familyId}/relationships`),
    create: (data: { fromMemberId: string; toMemberId: string; type: string }) =>
      request<any>('/relationships', { method: 'POST', body: data }),
    remove: (id: string) => request<any>(`/relationships/${id}`, { method: 'DELETE' }),
  },
  invitations: {
    list: () => request<any[]>('/invitations'),
    listAll: () => request<any[]>('/invitations/all'),
    listReceived: () => request<any[]>('/invitations/received'),
    create: (data: { familyId: string; email: string; role?: string }) =>
      request<any>('/invitations', { method: 'POST', body: data }),
    accept: (id: string) => request<any>(`/invitations/${id}/accept`, { method: 'PATCH' }),
    decline: (id: string) => request<any>(`/invitations/${id}/decline`, { method: 'PATCH' }),
    remove: (id: string) => request<any>(`/invitations/${id}`, { method: 'DELETE' }),
    checkUser: (email: string) =>
      request<{ exists: boolean; user: any }>(
        `/invitations/check-user?email=${encodeURIComponent(email)}`,
      ),
  },
  discovery: {
    list: () => request('/discovery'),
    stats: () => request('/discovery/stats'),
    markViewed: (id: string) => request(`/discovery/${id}/viewed`, { method: 'PATCH' }),
  },
  duplicates: {
    list: (params?: { status?: string; minScore?: number; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.minScore) q.set('minScore', String(params.minScore));
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request(`/duplicates?${q.toString()}`);
    },
    detect: () => request('/duplicates/detect'),
    get: (id: string) => request(`/duplicates/${id}`),
    review: (id: string, action: string) =>
      request(`/duplicates/${id}/review`, { method: 'PATCH', body: JSON.stringify({ action }) }),
    byFamily: (familyId: string) => request(`/duplicates/family/${familyId}`),
  },
  smartInvite: {
    search: (familyId: string, query: string) =>
      request(`/families/${familyId}/members/smart-invite?query=${encodeURIComponent(query)}`),
  },
  search: {
    global: (query: string, options?: { page?: number; limit?: number; type?: string }) => {
      const params = new URLSearchParams({ q: query });
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.type) params.set('type', options.type);
      return request<{ users: any[]; members: any[]; families: any[]; total: number }>(
        `/search?${params.toString()}`,
      );
    },
  },
  merge: {
    createRequest: (sourceFamilyId: string, targetFamilyId: string) =>
      request<any>('/merge/request', { method: 'POST', body: { sourceFamilyId, targetFamilyId } }),
    approve: (id: string) => request<any>(`/merge/${id}/approve`, { method: 'PATCH' }),
    reject: (id: string) => request<any>(`/merge/${id}/reject`, { method: 'PATCH' }),
    list: () => request<any[]>('/merge'),
    auditLog: (id: string) => request<any[]>(`/merge/${id}/audit`),
    preview: (sourceMemberId: string, targetMemberId: string) =>
      request<any>(
        `/merge/preview?sourceMemberId=${sourceMemberId}&targetMemberId=${targetMemberId}`,
      ),
    execute: (data: { sourceMemberId: string; targetMemberId: string; strategy: string }) =>
      request<any>('/merge/execute', { method: 'POST', body: JSON.stringify(data) }),
    undo: (snapshotId: string) => request<any>(`/merge/${snapshotId}/undo`, { method: 'POST' }),
    history: () => request<any[]>('/merge/history'),
    historyDetail: (id: string) => request<any>(`/merge/history/${id}`),
  },
  notifications: {
    list: (options?: {
      page?: number;
      limit?: number;
      type?: string;
      category?: string;
      isRead?: boolean;
      isArchived?: boolean;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.type) params.set('type', options.type);
      if (options?.category) params.set('category', options.category);
      if (options?.isRead !== undefined) params.set('isRead', String(options.isRead));
      if (options?.isArchived !== undefined) params.set('isArchived', String(options.isArchived));
      if (options?.search) params.set('search', options.search);
      if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
      if (options?.dateTo) params.set('dateTo', options.dateTo);
      return request<{
        notifications: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/notifications?${params.toString()}`);
    },
    unreadCount: () => request<{ count: number }>('/notifications/unread'),
    get: (id: string) => request<any>(`/notifications/${id}`),
    markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),
    archive: (id: string) => request<any>(`/notifications/${id}/archive`, { method: 'PATCH' }),
    delete: (id: string) => request<any>(`/notifications/${id}`, { method: 'DELETE' }),
    clearRead: () => request<any>('/notifications/clear-read', { method: 'DELETE' }),
    preferences: {
      get: () => request<any>('/notifications/preferences'),
      update: (data: Record<string, boolean>) =>
        request<any>('/notifications/preferences', { method: 'PATCH', body: data }),
    },
    stats: () => request<any>('/notifications/stats'),
  },
  activities: {
    list: (options?: {
      page?: number;
      limit?: number;
      search?: string;
      eventType?: string;
      visibility?: string;
      familyId?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: string;
    }) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.search) params.set('search', options.search);
      if (options?.eventType) params.set('eventType', options.eventType);
      if (options?.visibility) params.set('visibility', options.visibility);
      if (options?.familyId) params.set('familyId', options.familyId);
      if (options?.userId) params.set('userId', options.userId);
      if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
      if (options?.dateTo) params.set('dateTo', options.dateTo);
      if (options?.sortBy) params.set('sortBy', options.sortBy);
      if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
      return request<{
        activities: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/activities?${params.toString()}`);
    },
    mine: (options?: { page?: number; limit?: number; eventType?: string }) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.eventType) params.set('eventType', options.eventType);
      return request<{
        activities: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/activities/me?${params.toString()}`);
    },
    get: (id: string) => request<any>(`/activities/${id}`),
    byFamily: (
      familyId: string,
      options?: {
        page?: number;
        limit?: number;
        eventType?: string;
        dateFrom?: string;
        dateTo?: string;
      },
    ) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.eventType) params.set('eventType', options.eventType);
      if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
      if (options?.dateTo) params.set('dateTo', options.dateTo);
      return request<{
        activities: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/activities/family/${familyId}?${params.toString()}`);
    },
    byUser: (userId: string, options?: { page?: number; limit?: number; eventType?: string }) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.eventType) params.set('eventType', options.eventType);
      return request<{
        activities: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/activities/user/${userId}?${params.toString()}`);
    },
    stats: () => request<any>('/activities/stats'),
    addComment: (id: string, content: string) =>
      request<any>(`/activities/${id}/comments`, { method: 'POST', body: { content } }),
    removeComment: (activityId: string, commentId: string) =>
      request<any>(`/activities/${activityId}/comments/${commentId}`, { method: 'DELETE' }),
    toggleReaction: (id: string, type?: string) =>
      request<any>(`/activities/${id}/reactions`, {
        method: 'POST',
        body: { type: type || 'LIKE' },
      }),
    delete: (id: string) => request<any>(`/activities/${id}`, { method: 'DELETE' }),
  },
  memories: {
    create: (data: any) => request<any>('/memories', { method: 'POST', body: data }),
    list: (options?: {
      page?: number;
      limit?: number;
      search?: string;
      familyId?: string;
      memberId?: string;
      tag?: string;
      location?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: string;
    }) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.search) params.set('search', options.search);
      if (options?.familyId) params.set('familyId', options.familyId);
      if (options?.memberId) params.set('memberId', options.memberId);
      if (options?.tag) params.set('tag', options.tag);
      if (options?.location) params.set('location', options.location);
      if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
      if (options?.dateTo) params.set('dateTo', options.dateTo);
      if (options?.sortBy) params.set('sortBy', options.sortBy);
      if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
      return request<{
        memories: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/memories?${params.toString()}`);
    },
    get: (id: string) => request<any>(`/memories/${id}`),
    update: (id: string, data: any) =>
      request<any>(`/memories/${id}`, { method: 'PATCH', body: data }),
    delete: (id: string) => request<any>(`/memories/${id}`, { method: 'DELETE' }),
    stats: () => request<any>('/memories/stats'),
    byFamily: (
      familyId: string,
      options?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
    ) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.sortBy) params.set('sortBy', options.sortBy);
      if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
      return request<{
        memories: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/memories/family/${familyId}?${params.toString()}`);
    },
    byMember: (memberId: string, options?: { page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      return request<{
        memories: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/memories/member/${memberId}?${params.toString()}`);
    },
    addComment: (id: string, content: string) =>
      request<any>(`/memories/${id}/comments`, { method: 'POST', body: { content } }),
    removeComment: (memoryId: string, commentId: string) =>
      request<any>(`/memories/${memoryId}/comments/${commentId}`, { method: 'DELETE' }),
    toggleReaction: (id: string, type?: string) =>
      request<any>(`/memories/${id}/reactions`, { method: 'POST', body: { type: type || 'LIKE' } }),
  },
  timeline: {
    create: (data: any) => request<any>('/timeline', { method: 'POST', body: data }),
    list: (options?: {
      page?: number;
      limit?: number;
      familyId?: string;
      memberId?: string;
      eventType?: string;
      category?: string;
      status?: string;
      visibility?: string;
      dateFrom?: string;
      dateTo?: string;
      cursor?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    }) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.familyId) params.set('familyId', options.familyId);
      if (options?.memberId) params.set('memberId', options.memberId);
      if (options?.eventType) params.set('eventType', options.eventType);
      if (options?.category) params.set('category', options.category);
      if (options?.status) params.set('status', options.status);
      if (options?.visibility) params.set('visibility', options.visibility);
      if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
      if (options?.dateTo) params.set('dateTo', options.dateTo);
      if (options?.cursor) params.set('cursor', options.cursor);
      if (options?.search) params.set('search', options.search);
      if (options?.sortBy) params.set('sortBy', options.sortBy);
      if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
      return request<{
        events: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/timeline?${params.toString()}`);
    },
    get: (id: string) => request<any>(`/timeline/${id}`),
    delete: (id: string) => request<any>(`/timeline/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids: string[]) =>
      request<{ deleted: number }>('/timeline/bulk-delete', { method: 'POST', body: { ids } }),
    bulkUpdateStatus: (ids: string[], status: string) =>
      request<{ updated: number }>('/timeline/bulk-update-status', {
        method: 'POST',
        body: { ids, status },
      }),
    rollbackToVersion: (eventId: string, versionId: string) =>
      request<any>(`/timeline/${eventId}/versions/${versionId}/rollback`, { method: 'POST' }),
    stats: () => request<any>('/timeline/stats'),
    byFamily: (
      familyId: string,
      options?: { page?: number; limit?: number; eventType?: string },
    ) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.eventType) params.set('eventType', options.eventType);
      return request<{
        events: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/timeline/family/${familyId}?${params.toString()}`);
    },
    byMember: (memberId: string, options?: { page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      return request<{
        events: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/timeline/member/${memberId}?${params.toString()}`);
    },
    upcoming: () => request<{ events: any[] }>('/timeline/upcoming'),
    calendar: (year: number, month: number) =>
      request<{ events: any[]; grouped: Record<string, any[]> }>(
        `/timeline/calendar?year=${year}&month=${month}`,
      ),
    calendarWeek: (startDate: string) =>
      request<{ events: any[] }>(`/timeline/calendar/week?startDate=${startDate}`),
    agenda: (dateFrom: string, dateTo: string) =>
      request<{ events: any[] }>(`/timeline/agenda?dateFrom=${dateFrom}&dateTo=${dateTo}`),
    today: () => request<{ events: any[] }>('/timeline/today'),
    recent: () => request<{ events: any[] }>('/timeline/recent'),
    birthdays: () => request<{ events: any[] }>('/timeline/birthdays'),
    anniversaries: () => request<{ events: any[] }>('/timeline/anniversaries'),
    widget: () =>
      request<{ upcoming: any[]; today: any[]; birthdays: any[]; recent: any[] }>(
        '/timeline/widget',
      ),
    update: (id: string, data: any) =>
      request<any>(`/timeline/${id}`, { method: 'PATCH', body: data }),
    cancel: (id: string) => request<any>(`/timeline/${id}/cancel`, { method: 'PATCH' }),
    complete: (id: string) => request<any>(`/timeline/${id}/complete`, { method: 'PATCH' }),
    rsvp: (id: string, rsvpStatus: string) =>
      request<any>(`/timeline/${id}/rsvp`, { method: 'POST', body: { rsvpStatus } }),
    participants: (id: string) =>
      request<{ participants: any[]; stats: any }>(`/timeline/${id}/participants`),
    publish: (id: string) => request<any>(`/timeline/${id}/publish`, { method: 'PATCH' }),
    archive: (id: string) => request<any>(`/timeline/${id}/archive`, { method: 'PATCH' }),
    schedule: (id: string) => request<any>(`/timeline/${id}/schedule`, { method: 'PATCH' }),
    pin: (id: string) => request<any>(`/timeline/${id}/pin`, { method: 'PATCH' }),
    feature: (id: string) => request<any>(`/timeline/${id}/feature`, { method: 'PATCH' }),
    duplicate: (id: string) => request<any>(`/timeline/${id}/duplicate`, { method: 'POST' }),
    search: (q: string, page?: number, limit?: number) => {
      const params = new URLSearchParams({ q });
      if (page) params.set('page', String(page));
      if (limit) params.set('limit', String(limit));
      return request<{
        events: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/timeline/search?${params.toString()}`);
    },
    saveDraft: (data: any) => request<any>('/timeline/draft', { method: 'POST', body: data }),
    getDrafts: (familyId?: string) => {
      const params = familyId ? `?familyId=${familyId}` : '';
      return request<any[]>(`/timeline/drafts${params}`);
    },
    addComment: (eventId: string, content: string, parentId?: string) =>
      request<any>(`/timeline/${eventId}/comments`, {
        method: 'POST',
        body: { content, parentId },
      }),
    getComments: (eventId: string, page?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (page) params.set('page', String(page));
      if (limit) params.set('limit', String(limit));
      return request<{
        comments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/timeline/${eventId}/comments?${params.toString()}`);
    },
    updateComment: (commentId: string, content: string) =>
      request<any>(`/timeline/comments/${commentId}`, { method: 'PATCH', body: { content } }),
    deleteComment: (commentId: string) =>
      request<any>(`/timeline/comments/${commentId}`, { method: 'DELETE' }),
    addReaction: (eventId: string, emoji: string) =>
      request<any>(`/timeline/${eventId}/reactions`, { method: 'POST', body: { emoji } }),
    getReactions: (eventId: string) =>
      request<{ reactions: any[]; grouped: Record<string, any[]>; total: number }>(
        `/timeline/${eventId}/reactions`,
      ),
    addDocument: (eventId: string, data: any) =>
      request<any>(`/timeline/${eventId}/documents`, { method: 'POST', body: data }),
    getDocuments: (eventId: string) =>
      request<{ documents: any[]; total: number }>(`/timeline/${eventId}/documents`),
    updateDocument: (docId: string, data: any) =>
      request<any>(`/timeline/documents/${docId}`, { method: 'PATCH', body: data }),
    removeDocument: (docId: string) =>
      request<any>(`/timeline/documents/${docId}`, { method: 'DELETE' }),
    getActivity: (eventId: string, page?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (page) params.set('page', String(page));
      if (limit) params.set('limit', String(limit));
      return request<{
        activities: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/timeline/${eventId}/activity?${params.toString()}`);
    },
    getHistory: (eventId: string, page?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (page) params.set('page', String(page));
      if (limit) params.set('limit', String(limit));
      return request<{
        history: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/timeline/${eventId}/history?${params.toString()}`);
    },
    addTags: (eventId: string, tags: string[]) =>
      request<any>(`/timeline/${eventId}/tags`, { method: 'POST', body: { tags } }),
    removeTags: (eventId: string, tags: string[]) =>
      request<any>(`/timeline/${eventId}/tags`, { method: 'DELETE', body: { tags } }),
    addKeywords: (eventId: string, keywords: string[]) =>
      request<any>(`/timeline/${eventId}/keywords`, { method: 'POST', body: { keywords } }),
    removeKeywords: (eventId: string, keywords: string[]) =>
      request<any>(`/timeline/${eventId}/keywords`, { method: 'DELETE', body: { keywords } }),
    reminders: {
      list: (eventId: string) => request<{ reminders: any[] }>(`/timeline/${eventId}/reminders`),
      create: (eventId: string, data: { date: string; channel: string; message: string }) =>
        request<any>(`/timeline/${eventId}/reminders`, { method: 'POST', body: data }),
      delete: (eventId: string, reminderId: string) =>
        request<any>(`/timeline/${eventId}/reminders/${reminderId}`, { method: 'DELETE' }),
    },
    exportPdf: (eventId: string) =>
      request<any>(`/timeline/events/${eventId}/print/generate`, { method: 'POST' }),
    exportJson: (eventId: string) => request<any>(`/timeline/${eventId}/export/json`),
    exportCsv: (eventId: string) => request<string>(`/timeline/${eventId}/export/csv`),

    getInfo: (eventId: string, eventType: string) =>
      request<any>(`/timeline/events/${eventId}/info`, {
        method: 'GET',
        body: JSON.stringify({ eventType }),
      }),
    upsertInfo: (eventId: string, eventType: string, data: any) =>
      request<any>(`/timeline/events/${eventId}/info`, {
        method: 'PUT',
        body: JSON.stringify({ eventType, data }),
      }),
    getSummary: (eventId: string) => request<any>(`/timeline/events/${eventId}/summary`),
    generateSummary: (eventId: string) =>
      request<any>(`/timeline/events/${eventId}/summary/generate`, { method: 'POST' }),
    updateSummary: (eventId: string, editedText: string) =>
      request<any>(`/timeline/events/${eventId}/summary`, {
        method: 'PUT',
        body: JSON.stringify({ editedText }),
      }),
    getPrintVersion: (eventId: string) => request<any>(`/timeline/events/${eventId}/print`),
    generatePrint: (eventId: string, options?: any) =>
      request<any>(`/timeline/events/${eventId}/print/generate`, {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }),
    exportEventJson: (eventId: string) => request<any>(`/timeline/events/${eventId}/export/json`),
    getAttendance: (eventId: string) => request<any>(`/timeline/events/${eventId}/attendance`),
    checkIn: (eventId: string, userId: string, method: string, location?: any) =>
      request<any>(`/timeline/events/${eventId}/attendance/check-in`, {
        method: 'POST',
        body: JSON.stringify({ userId, method, location }),
      }),
    checkOut: (eventId: string, userId: string) =>
      request<any>(`/timeline/events/${eventId}/attendance/check-out`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    verifyAttendance: (eventId: string, userId: string) =>
      request<any>(`/timeline/events/${eventId}/attendance/verify`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    getAttendanceStats: (eventId: string) =>
      request<any>(`/timeline/events/${eventId}/attendance/stats`),

    // File Upload
    uploadMedia: async (eventId: string, files: File[]) => {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE}/upload/event-media/${eventId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },

    uploadDocument: async (eventId: string, files: File[]) => {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE}/upload/event-document/${eventId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },

    uploadGeneric: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE}/upload/generic`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },

    deleteFile: (url: string) =>
      request<any>('/upload/delete', {
        method: 'POST',
        body: { url },
      }),
  },
  eventInvitations: {
    create: (data: any) =>
      request('/event-invitations', { method: 'POST', body: JSON.stringify(data) }),
    byEvent: (eventId: string) => request(`/event-invitations/event/${eventId}`),
    eventStats: (eventId: string) => request(`/event-invitations/event/${eventId}/stats`),
    mine: () => request('/event-invitations/mine'),
    respond: (id: string, status: string, message?: string) =>
      request(`/event-invitations/${id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ status, message }),
      }),
  },
  clans: {
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      country?: string;
      verified?: boolean;
    }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.search) q.set('search', params.search);
      if (params?.status) q.set('status', params.status);
      if (params?.country) q.set('country', params.country);
      if (params?.verified !== undefined) q.set('verified', String(params.verified));
      return request(`/clans?${q.toString()}`);
    },
    get: (slug: string) => request(`/clans/${slug}`),
    getStats: (slug: string) => request(`/clans/${slug}/stats`),
    dashboard: (slug: string) => request(`/clans/${slug}/dashboard`),
    search: (slug: string, query: string) =>
      request(`/clans/${slug}/search?q=${encodeURIComponent(query)}`),
    top: (limit?: number) => request(`/clans/top?limit=${limit || 10}`),
    popular: (limit?: number) => request(`/clans/popular?limit=${limit || 10}`),
    recent: (limit?: number) => request(`/clans/recent?limit=${limit || 10}`),
    user: () => request('/clans/user'),
    create: (data: any) => request('/clans', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/clans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/clans/${id}`, { method: 'DELETE' }),
    join: (clanId: string, familyId: string) =>
      request(`/clans/${clanId}/join`, { method: 'POST', body: JSON.stringify({ familyId }) }),
    leave: (clanId: string, familyId: string) =>
      request(`/clans/${clanId}/leave`, { method: 'POST', body: JSON.stringify({ familyId }) }),
  },
  communities: {
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      country?: string;
      verified?: boolean;
    }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.search) q.set('search', params.search);
      if (params?.status) q.set('status', params.status);
      if (params?.country) q.set('country', params.country);
      if (params?.verified !== undefined) q.set('verified', String(params.verified));
      return request(`/communities?${q.toString()}`);
    },
    get: (slug: string) => request(`/communities/${slug}`),
    getStats: (slug: string) => request(`/communities/${slug}/stats`),
    top: (limit?: number) => request(`/communities/top?limit=${limit || 10}`),
    popular: (limit?: number) => request(`/communities/popular?limit=${limit || 10}`),
    recent: (limit?: number) => request(`/communities/recent?limit=${limit || 10}`),
    user: () => request('/communities/user'),
    create: (data: any) => request('/communities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/communities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/communities/${id}`, { method: 'DELETE' }),
    getAdmins: (id: string) => request(`/communities/${id}/admins`),
    addAdmin: (id: string, data: any) =>
      request(`/communities/${id}/admins`, { method: 'POST', body: JSON.stringify(data) }),
    updateAdmin: (id: string, adminId: string, data: any) =>
      request(`/communities/${id}/admins/${adminId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    removeAdmin: (id: string, adminId: string) =>
      request(`/communities/${id}/admins/${adminId}`, { method: 'DELETE' }),
    getRequests: (id: string) => request(`/communities/${id}/requests`),
    createRequest: (id: string, data?: any) =>
      request(`/communities/${id}/requests`, { method: 'POST', body: JSON.stringify(data || {}) }),
    deleteRequest: (id: string, requestId: string) =>
      request(`/communities/${id}/requests/${requestId}`, { method: 'DELETE' }),
    approveRequest: (id: string, requestId: string) =>
      request(`/communities/${id}/requests/${requestId}/approve`, { method: 'PATCH' }),
    rejectRequest: (id: string, requestId: string) =>
      request(`/communities/${id}/requests/${requestId}/reject`, { method: 'PATCH' }),
    getRequestStats: (id: string) => request(`/communities/${id}/requests/stats`),
  },
  subclans: {
    listByClan: (clanSlug: string, params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.search) q.set('search', params.search);
      return request(`/clans/${clanSlug}/subclans?${q.toString()}`);
    },
    listByClanId: (clanId: string) => request<any[]>(`/clans/${clanId}/subclans`),
    get: (slug: string) => request(`/subclans/${slug}`),
    getStats: (slug: string) => request(`/subclans/${slug}/stats`),
    create: (clanId: string, data: any) =>
      request(`/clans/${clanId}/subclans`, { method: 'POST', body: JSON.stringify(data) }),
    createDirect: (data: any) =>
      request('/subclans', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/subclans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/subclans/${id}`, { method: 'DELETE' }),
    getTree: (id: string) => request(`/subclans/${id}/tree`),
    getBreadcrumbs: (id: string) =>
      request<{ id: string; name: string; slug: string; type: string }[]>(
        `/subclans/${id}/breadcrumbs`,
      ),
  },
  clanRequests: {
    create: (clanId: string, data: any) =>
      request(`/clans/${clanId}/requests`, { method: 'POST', body: JSON.stringify(data) }),
    list: (clanId: string, status?: string) =>
      request(`/clans/${clanId}/requests${status ? `?status=${status}` : ''}`),
    stats: (clanId: string) => request(`/clans/${clanId}/requests/stats`),
    mine: () => request('/clan-requests/mine'),
    accept: (id: string, response?: string) =>
      request(`/clan-requests/${id}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({ response }),
      }),
    reject: (id: string, response?: string) =>
      request(`/clan-requests/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ response }),
      }),
    cancel: (id: string) => request(`/clan-requests/${id}`, { method: 'DELETE' }),
  },
  clanHistory: {
    get: (clanId: string) => request(`/clans/${clanId}/history`),
    getSection: (clanId: string, section: string) => request(`/clans/${clanId}/history/${section}`),
    create: (clanId: string, data: { section: string; content: string }) =>
      request(`/clans/${clanId}/history`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, content: string) =>
      request(`/clan-history/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
    pending: (clanId: string) => request(`/clans/${clanId}/history/pending`),
    allWithModeration: (clanId: string) => request(`/clans/${clanId}/history/all`),
    approve: (id: string, note?: string) =>
      request(`/clan-history/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ note }) }),
    reject: (id: string, note?: string) =>
      request(`/clan-history/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ note }) }),
    requestChanges: (id: string, note: string) =>
      request(`/clan-history/${id}/request-changes`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      }),
  },
  communityHistory: {
    listByCommunity: (communityId: string, params?: { type?: string; verified?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.verified !== undefined) q.set('verified', String(params.verified));
      return request<any[]>(`/community-history/community/${communityId}?${q.toString()}`);
    },
    get: (id: string) => request(`/community-history/${id}`),
    create: (data: any) =>
      request('/community-history', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/community-history/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/community-history/${id}`, { method: 'DELETE' }),
  },
  communityGallery: {
    listByCommunity: (communityId: string, params?: { type?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      return request<any[]>(`/community-gallery/community/${communityId}?${q.toString()}`);
    },
    get: (id: string) => request(`/community-gallery/${id}`),
    create: (data: any) =>
      request('/community-gallery', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/community-gallery/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/community-gallery/${id}`, { method: 'DELETE' }),
  },
  communityDirectory: {
    listByCommunity: (
      communityId: string,
      params?: { role?: string; verified?: boolean; status?: string; search?: string },
    ) => {
      const q = new URLSearchParams();
      if (params?.role) q.set('role', params.role);
      if (params?.verified !== undefined) q.set('verified', String(params.verified));
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      return request<any[]>(`/community-directory/community/${communityId}?${q.toString()}`);
    },
    stats: (communityId: string) => request(`/community-directory/community/${communityId}/stats`),
    join: (communityId: string) =>
      request('/community-directory', { method: 'POST', body: JSON.stringify({ communityId }) }),
    get: (id: string) => request(`/community-directory/${id}`),
    update: (id: string, data: any) =>
      request(`/community-directory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    verify: (id: string) => request(`/community-directory/${id}/verify`, { method: 'PATCH' }),
    remove: (id: string) => request(`/community-directory/${id}`, { method: 'DELETE' }),
  },
  communityEvents: {
    listByCommunity: (
      communityId: string,
      params?: { type?: string; status?: string; upcoming?: boolean },
    ) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.status) q.set('status', params.status);
      if (params?.upcoming !== undefined) q.set('upcoming', String(params.upcoming));
      return request<any[]>(`/community-events/community/${communityId}?${q.toString()}`);
    },
    stats: (communityId: string) => request(`/community-events/community/${communityId}/stats`),
    get: (id: string) => request(`/community-events/${id}`),
    create: (data: any) =>
      request('/community-events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/community-events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/community-events/${id}`, { method: 'DELETE' }),
  },
  communityNews: {
    listByCommunity: (
      communityId: string,
      params?: { type?: string; status?: string; featured?: boolean },
    ) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.status) q.set('status', params.status);
      if (params?.featured !== undefined) q.set('featured', String(params.featured));
      return request<any[]>(`/community-news/community/${communityId}?${q.toString()}`);
    },
    get: (id: string) => request(`/community-news/${id}`),
    create: (data: any) =>
      request('/community-news', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/community-news/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/community-news/${id}`, { method: 'DELETE' }),
  },
  communityDocuments: {
    listByCommunity: (communityId: string, params?: { type?: string; verified?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.verified !== undefined) q.set('verified', String(params.verified));
      return request<any[]>(`/community-documents/community/${communityId}?${q.toString()}`);
    },
    get: (id: string) => request(`/community-documents/${id}`),
    create: (data: any) =>
      request('/community-documents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/community-documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/community-documents/${id}`, { method: 'DELETE' }),
  },
  communityLocations: {
    listByCommunity: (communityId: string, params?: { type?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      return request<any[]>(`/community-locations/community/${communityId}?${q.toString()}`);
    },
    distribution: (communityId: string) =>
      request(`/community-locations/community/${communityId}/distribution`),
    get: (id: string) => request(`/community-locations/${id}`),
    create: (data: any) =>
      request('/community-locations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/community-locations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/community-locations/${id}`, { method: 'DELETE' }),
  },
  followers: {
    followCommunity: (communityId: string) =>
      request(`/followers/community/${communityId}`, { method: 'POST' }),
    unfollowCommunity: (communityId: string) =>
      request(`/followers/community/${communityId}`, { method: 'DELETE' }),
    checkCommunity: (communityId: string) =>
      request<{ isFollowing: boolean }>(`/followers/community/${communityId}/check`),
    communityCount: (communityId: string) =>
      request<{ count: number }>(`/followers/community/${communityId}/count`),
    communityList: (communityId: string, params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request(`/followers/community/${communityId}?${q.toString()}`);
    },
    followClan: (clanId: string) => request(`/followers/clan/${clanId}`, { method: 'POST' }),
    unfollowClan: (clanId: string) => request(`/followers/clan/${clanId}`, { method: 'DELETE' }),
    checkClan: (clanId: string) =>
      request<{ isFollowing: boolean }>(`/followers/clan/${clanId}/check`),
    clanCount: (clanId: string) => request<{ count: number }>(`/followers/clan/${clanId}/count`),
    clanList: (clanId: string, params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request(`/followers/clan/${clanId}?${q.toString()}`);
    },
    myFollows: (type?: string) => request(`/followers/me${type ? `?type=${type}` : ''}`),
  },
  bookmarks: {
    list: (params?: { entityType?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.entityType) q.set('entityType', params.entityType);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request<any[]>(`/bookmarks?${q.toString()}`);
    },
    create: (entityType: string, entityId: string) =>
      request('/bookmarks', { method: 'POST', body: JSON.stringify({ entityType, entityId }) }),
    check: (entityType: string, entityId: string) =>
      request<{ isBookmarked: boolean }>(
        `/bookmarks/check?entityType=${entityType}&entityId=${entityId}`,
      ),
    remove: (id: string) => request(`/bookmarks/${id}`, { method: 'DELETE' }),
  },
  reputation: {
    community: (communityId: string) => request(`/reputation/community/${communityId}`),
    calculateCommunity: (communityId: string) =>
      request(`/reputation/community/${communityId}/calculate`, { method: 'POST' }),
    clan: (clanId: string) => request(`/reputation/clan/${clanId}`),
    calculateClan: (clanId: string) =>
      request(`/reputation/clan/${clanId}/calculate`, { method: 'POST' }),
    topCommunities: (params?: { sort?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.sort) q.set('sort', params.sort);
      if (params?.limit) q.set('limit', String(params.limit));
      return request<any[]>(`/reputation/communities/top?${q.toString()}`);
    },
    topClans: (params?: { sort?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.sort) q.set('sort', params.sort);
      if (params?.limit) q.set('limit', String(params.limit));
      return request<any[]>(`/reputation/clans/top?${q.toString()}`);
    },
  },
  knowledgeBase: {
    list: (params?: { entityType?: string; entityId?: string; type?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.entityType) q.set('entityType', params.entityType);
      if (params?.entityId) q.set('entityId', params.entityId);
      if (params?.type) q.set('type', params.type);
      if (params?.status) q.set('status', params.status);
      return request<any[]>(`/knowledge-base?${q.toString()}`);
    },
    byEntity: (entityType: string, entityId: string) =>
      request<any[]>(`/knowledge-base/entity/${entityType}/${entityId}`),
    get: (id: string) => request(`/knowledge-base/${id}`),
    create: (data: any) =>
      request('/knowledge-base', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/knowledge-base/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/knowledge-base/${id}`, { method: 'DELETE' }),
  },
  featured: {
    communities: (limit?: number) => request<any[]>(`/featured/communities?limit=${limit || 10}`),
    clans: (limit?: number) => request<any[]>(`/featured/clans?limit=${limit || 10}`),
    trendingCommunities: (limit?: number) =>
      request<any[]>(`/featured/communities/trending?limit=${limit || 10}`),
    trendingClans: (limit?: number) =>
      request<any[]>(`/featured/clans/trending?limit=${limit || 10}`),
    relatedCommunities: (communityId: string, limit?: number) =>
      request<any[]>(`/featured/communities/${communityId}/related?limit=${limit || 5}`),
    relatedClans: (clanId: string, limit?: number) =>
      request<any[]>(`/featured/clans/${clanId}/related?limit=${limit || 5}`),
    communityStats: (communityId: string) => request(`/featured/community-stats/${communityId}`),
    clanStats: (clanId: string) => request(`/featured/clan-stats/${clanId}`),
  },
  aiInsights: {
    community: (communityId: string) => request<any[]>(`/ai-insights/community/${communityId}`),
    clan: (clanId: string) => request<any[]>(`/ai-insights/clan/${clanId}`),
    storeCommunity: (communityId: string, data: any) =>
      request(`/ai-insights/community/${communityId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    storeClan: (clanId: string, data: any) =>
      request(`/ai-insights/clan/${clanId}`, { method: 'POST', body: JSON.stringify(data) }),
  },
  clanGallery: {
    listByClan: (clanId: string, params?: { type?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      return request<any[]>(`/clan-gallery/clan/${clanId}?${q.toString()}`);
    },
    get: (id: string) => request(`/clan-gallery/${id}`),
    create: (data: any) => request('/clan-gallery', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/clan-gallery/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/clan-gallery/${id}`, { method: 'DELETE' }),
  },
  clanDirectory: {
    listByClan: (
      clanId: string,
      params?: { role?: string; verified?: boolean; status?: string; search?: string },
    ) => {
      const q = new URLSearchParams();
      if (params?.role) q.set('role', params.role);
      if (params?.verified !== undefined) q.set('verified', String(params.verified));
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      return request<any[]>(`/clan-directory/clan/${clanId}?${q.toString()}`);
    },
    stats: (clanId: string) => request(`/clan-directory/clan/${clanId}/stats`),
    join: (clanId: string) =>
      request('/clan-directory', { method: 'POST', body: JSON.stringify({ clanId }) }),
    get: (id: string) => request(`/clan-directory/${id}`),
    update: (id: string, data: any) =>
      request(`/clan-directory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    verify: (id: string) => request(`/clan-directory/${id}/verify`, { method: 'PATCH' }),
    remove: (id: string) => request(`/clan-directory/${id}`, { method: 'DELETE' }),
  },
  clanEvents: {
    listByClan: (clanId: string, params?: { type?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.status) q.set('status', params.status);
      return request<any[]>(`/clan-events/clan/${clanId}?${q.toString()}`);
    },
    stats: (clanId: string) => request(`/clan-events/clan/${clanId}/stats`),
    get: (id: string) => request(`/clan-events/${id}`),
    create: (data: any) => request('/clan-events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/clan-events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/clan-events/${id}`, { method: 'DELETE' }),
  },
  clanDocuments: {
    listByClan: (clanId: string, params?: { type?: string; verified?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.verified !== undefined) q.set('verified', String(params.verified));
      return request<any[]>(`/clan-documents/clan/${clanId}?${q.toString()}`);
    },
    get: (id: string) => request(`/clan-documents/${id}`),
    create: (data: any) =>
      request('/clan-documents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/clan-documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/clan-documents/${id}`, { method: 'DELETE' }),
  },
  clanLocations: {
    listByClan: (clanId: string, params?: { type?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      return request<any[]>(`/clan-locations/clan/${clanId}?${q.toString()}`);
    },
    distribution: (clanId: string) => request(`/clan-locations/clan/${clanId}/distribution`),
    get: (id: string) => request(`/clan-locations/${id}`),
    create: (data: any) =>
      request('/clan-locations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/clan-locations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/clan-locations/${id}`, { method: 'DELETE' }),
  },
  documentVault: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams();
      if (params)
        Object.entries(params).forEach(([k, v]) => {
          if (v) q.set(k, v);
        });
      return request<any>(`/document-vault?${q.toString()}`);
    },
    get: (id: string) => request(`/document-vault/${id}`),
    create: (data: any) =>
      request('/document-vault', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/document-vault/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/document-vault/${id}`, { method: 'DELETE' }),
    restore: (id: string) => request(`/document-vault/${id}/restore`, { method: 'PATCH' }),
    permanentDelete: (id: string) =>
      request(`/document-vault/${id}/permanent`, { method: 'DELETE' }),
    favorite: (id: string) => request(`/document-vault/${id}/favorite`, { method: 'PATCH' }),
    stats: () => request('/document-vault/stats'),
    search: (q: string) => request(`/document-vault/search?q=${encodeURIComponent(q)}`),
    recent: (limit?: number) => request(`/document-vault/recent?limit=${limit || 10}`),
    sharedWithMe: () => request('/document-vault/shared-with-me'),
    deleted: () => request('/document-vault/deleted'),
    accessLogs: (id: string) => request(`/document-vault/${id}/access-logs`),
    versions: {
      list: (docId: string) => request(`/document-vault/${docId}/versions`),
      create: (docId: string, data: any) =>
        request(`/document-vault/${docId}/versions`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      restore: (docId: string, version: number) =>
        request(`/document-vault/${docId}/versions/${version}/restore`, { method: 'PATCH' }),
    },
    folders: {
      list: (params?: Record<string, string>) => {
        const q = new URLSearchParams();
        if (params)
          Object.entries(params).forEach(([k, v]) => {
            if (v) q.set(k, v);
          });
        return request<any[]>(`/document-vault/folders/list?${q.toString()}`);
      },
      get: (id: string) => request(`/document-vault/folders/${id}`),
      create: (data: any) =>
        request('/document-vault/folders', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        request(`/document-vault/folders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      remove: (id: string) => request(`/document-vault/folders/${id}`, { method: 'DELETE' }),
    },
    shares: {
      list: (docId: string) => request(`/document-vault/${docId}/shares`),
      create: (data: any) =>
        request('/document-vault/shares', { method: 'POST', body: JSON.stringify(data) }),
      revoke: (shareId: string) =>
        request(`/document-vault/shares/${shareId}`, { method: 'DELETE' }),
    },
    accessLink: (token: string) => request(`/document-vault/access/${token}`),
    collections: {
      list: (params?: Record<string, string>) => {
        const q = new URLSearchParams();
        if (params)
          Object.entries(params).forEach(([k, v]) => {
            if (v) q.set(k, v);
          });
        return request<any[]>(`/document-vault/collections/list?${q.toString()}`);
      },
      get: (id: string) => request(`/document-vault/collections/${id}`),
      create: (data: any) =>
        request('/document-vault/collections', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        request(`/document-vault/collections/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      remove: (id: string) => request(`/document-vault/collections/${id}`, { method: 'DELETE' }),
      addItem: (id: string, data: any) =>
        request(`/document-vault/collections/${id}/items`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      removeItem: (collectionId: string, itemId: string) =>
        request(`/document-vault/collections/${collectionId}/items/${itemId}`, {
          method: 'DELETE',
        }),
    },
    attachments: {
      create: (data: any) =>
        request('/document-vault/attachments', { method: 'POST', body: JSON.stringify(data) }),
      getByEntity: (entityType: string, entityId: string) =>
        request(`/document-vault/attachments/${entityType}/${entityId}`),
      remove: (id: string) => request(`/document-vault/attachments/${id}`, { method: 'DELETE' }),
    },
    verifications: {
      create: (data: any) =>
        request('/document-vault/verifications', { method: 'POST', body: JSON.stringify(data) }),
      getByDocument: (documentId: string) => request(`/document-vault/verifications/${documentId}`),
      review: (id: string, data: any) =>
        request(`/document-vault/verifications/${id}/review`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
    },
    gallery: {
      list: (params?: Record<string, string>) => {
        const q = new URLSearchParams();
        if (params)
          Object.entries(params).forEach(([k, v]) => {
            if (v) q.set(k, v);
          });
        return request<any[]>(`/document-vault/gallery/list?${q.toString()}`);
      },
      get: (id: string) => request(`/document-vault/gallery/${id}`),
      create: (data: any) =>
        request('/document-vault/gallery', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        request(`/document-vault/gallery/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      remove: (id: string) => request(`/document-vault/gallery/${id}`, { method: 'DELETE' }),
    },
    references: {
      list: (params?: Record<string, string>) => {
        const q = new URLSearchParams();
        if (params)
          Object.entries(params).forEach(([k, v]) => {
            if (v) q.set(k, v);
          });
        return request<any[]>(`/document-vault/references/list?${q.toString()}`);
      },
      create: (data: any) =>
        request('/document-vault/references', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        request(`/document-vault/references/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      remove: (id: string) => request(`/document-vault/references/${id}`, { method: 'DELETE' }),
    },
    publicPages: {
      mine: () => request('/document-vault/public-pages/mine'),
      create: (data: any) =>
        request('/document-vault/public-pages', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        request(`/document-vault/public-pages/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      remove: (id: string) => request(`/document-vault/public-pages/${id}`, { method: 'DELETE' }),
      view: (slug: string) => request(`/document-vault/public/${slug}`),
    },
    knowledgeBase: {
      list: (params?: Record<string, string>) => {
        const q = new URLSearchParams();
        if (params)
          Object.entries(params).forEach(([k, v]) => {
            if (v) q.set(k, v);
          });
        return request<any[]>(`/document-vault/knowledge-base/list?${q.toString()}`);
      },
      get: (id: string) => request(`/document-vault/knowledge-base/${id}`),
      create: (data: any) =>
        request('/document-vault/knowledge-base', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        request(`/document-vault/knowledge-base/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      remove: (id: string) => request(`/document-vault/knowledge-base/${id}`, { method: 'DELETE' }),
      vote: (id: string, helpful: boolean) =>
        request(`/document-vault/knowledge-base/${id}/vote`, {
          method: 'POST',
          body: JSON.stringify({ helpful }),
        }),
    },
    analytics: {
      trending: (limit?: number) =>
        request(`/document-vault/analytics/trending?limit=${limit || 10}`),
      featured: (limit?: number) =>
        request(`/document-vault/analytics/featured?limit=${limit || 10}`),
      mostViewed: (limit?: number) =>
        request(`/document-vault/analytics/most-viewed?limit=${limit || 10}`),
      verified: (limit?: number) =>
        request(`/document-vault/analytics/verified?limit=${limit || 20}`),
      storage: () => request('/document-vault/analytics/storage'),
    },
    timeline: {
      family: (familyId: string) => request(`/document-vault/timeline/family/${familyId}`),
      clan: (clanId: string) => request(`/document-vault/timeline/clan/${clanId}`),
      community: (communityId: string) =>
        request(`/document-vault/timeline/community/${communityId}`),
      member: (memberId: string) => request(`/document-vault/timeline/member/${memberId}`),
    },
    smartOrg: {
      autoTag: (id: string) => request(`/document-vault/auto-tag/${id}`, { method: 'POST' }),
      suggestions: () => request('/document-vault/suggestions'),
    },
  },
  tree: {
    family: (familyId: string, depth?: number) =>
      request(`/tree/family/${familyId}?depth=${depth || 10}`),
    clan: (clanId: string, depth?: number) => request(`/tree/clan/${clanId}?depth=${depth || 5}`),
    community: (communityId: string, depth?: number) =>
      request(`/tree/community/${communityId}?depth=${depth || 4}`),
    ancestors: (memberId: string, depth?: number) =>
      request(`/tree/member/${memberId}/ancestors?depth=${depth || 10}`),
    descendants: (memberId: string, depth?: number) =>
      request(`/tree/member/${memberId}/descendants?depth=${depth || 10}`),
    search: (q: string, entityType?: string, entityId?: string) => {
      const params = new URLSearchParams({ q });
      if (entityType) params.set('entityType', entityType);
      if (entityId) params.set('entityId', entityId);
      return request(`/tree/search?${params.toString()}`);
    },
    stats: (entityType: string, entityId: string) =>
      request(`/tree/stats/${entityType}/${entityId}`),
    enhancedStats: (entityType: string, entityId: string) =>
      request(`/tree/enhanced-stats/${entityType}/${entityId}`),
    expandNode: (entityType: string, entityId: string, depth?: number) =>
      request('/tree/node/expand', {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId, depth }),
      }),
    commonAncestor: (memberIdA: string, memberIdB: string, depth?: number) =>
      request(
        `/tree/common-ancestor?memberIdA=${memberIdA}&memberIdB=${memberIdB}&depth=${depth || 20}`,
        { method: 'POST' },
      ),
    relationshipPath: (memberIdA: string, memberIdB: string, depth?: number) =>
      request(
        `/tree/relationship-path?memberIdA=${memberIdA}&memberIdB=${memberIdB}&depth=${depth || 20}`,
        { method: 'POST' },
      ),
    diagnostics: (entityType: string, entityId: string) =>
      request(`/tree/diagnostics/${entityType}/${entityId}`),
    seo: (entityType: string, entityId: string) => request(`/tree/seo/${entityType}/${entityId}`),
    views: {
      list: (page?: number, limit?: number) =>
        request(`/tree/views?page=${page || 1}&limit=${limit || 20}`),
      get: (id: string) => request(`/tree/views/${id}`),
      create: (data: any) => request('/tree/views', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        request(`/tree/views/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      remove: (id: string) => request(`/tree/views/${id}`, { method: 'DELETE' }),
      public: (page?: number, limit?: number) =>
        request(`/tree/views/public?page=${page || 1}&limit=${limit || 20}`),
      publicById: (id: string) => request(`/tree/views/public/${id}`),
    },
    layoutCache: {
      get: (entityType: string, entityId: string, treeType: string, layout: string) =>
        request(
          `/tree/layout-cache?entityType=${entityType}&entityId=${entityId}&treeType=${treeType}&layout=${layout}`,
        ),
      save: (data: any) =>
        request('/tree/layout-cache', { method: 'POST', body: JSON.stringify(data) }),
    },
    bookmarks: {
      list: (entityType?: string) =>
        request(`/tree/bookmarks${entityType ? `?entityType=${entityType}` : ''}`),
      create: (data: any) =>
        request('/tree/bookmarks', { method: 'POST', body: JSON.stringify(data) }),
      remove: (id: string) => request(`/tree/bookmarks/${id}`, { method: 'DELETE' }),
    },
    searchHistory: {
      list: (limit?: number) => request(`/tree/search-history?limit=${limit || 20}`),
      create: (data: any) =>
        request('/tree/search-history', { method: 'POST', body: JSON.stringify(data) }),
      remove: (id: string) => request(`/tree/search-history/${id}`, { method: 'DELETE' }),
    },
    viewHistory: {
      list: (limit?: number) => request(`/tree/view-history?limit=${limit || 20}`),
      remove: (id: string) => request(`/tree/view-history/${id}`, { method: 'DELETE' }),
    },
    recentlyAdded: (limit?: number) => request(`/tree/recently-added?limit=${limit || 10}`),
    recentlyUpdated: (limit?: number) => request(`/tree/recently-updated?limit=${limit || 10}`),
    popularBranches: (limit?: number) => request(`/tree/popular-branches?limit=${limit || 10}`),
    health: () => request('/tree/health'),
    performance: () => request('/tree/performance'),
  },
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
};
