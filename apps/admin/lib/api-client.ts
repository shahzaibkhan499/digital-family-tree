import { adminFetch } from './admin-api';

function request<T = Record<string, unknown>>(endpoint: string, options?: RequestInit): Promise<T> {
  return adminFetch<T>(endpoint, options);
}

export const api = {
  communityHistory: {
    listByCommunity: (communityId: string) => request(`/community-history/community/${communityId}`),
  },
  communityGallery: {
    listByCommunity: (communityId: string) => request(`/community-gallery/community/${communityId}`),
  },
  communityDirectory: {
    stats: (communityId: string) => request(`/community-directory/community/${communityId}/stats`),
    list: (communityId: string) => request(`/community-directory/community/${communityId}`),
  },
  communityEvents: {
    stats: (communityId: string) => request(`/community-events/community/${communityId}/stats`),
  },
  communityNews: {
    list: (communityId: string) => request(`/community-news/community/${communityId}`),
  },
  communityDocuments: {
    list: (communityId: string) => request(`/community-documents/community/${communityId}`),
  },
  clanGallery: {
    listByClan: (clanId: string) => request(`/clan-gallery/clan/${clanId}`),
  },
  clanDirectory: {
    stats: (clanId: string) => request(`/clan-directory/clan/${clanId}/stats`),
    list: (clanId: string) => request(`/clan-directory/clan/${clanId}`),
  },
  clanEvents: {
    stats: (clanId: string) => request(`/clan-events/clan/${clanId}/stats`),
  },
  clanDocuments: {
    list: (clanId: string) => request(`/clan-documents/clan/${clanId}`),
  },
  reputation: {
    community: (communityId: string) => request(`/reputation/community/${communityId}`),
    clan: (clanId: string) => request(`/reputation/clan/${clanId}`),
    topCommunities: () => request('/reputation/communities/top'),
    topClans: () => request('/reputation/clans/top'),
  },
  knowledgeBase: {
    list: (params?: { entityType?: string }) => {
      const q = new URLSearchParams();
      if (params?.entityType) q.set('entityType', params.entityType);
      return request(`/knowledge-base?${q.toString()}`);
    },
  },
  featured: {
    communities: () => request('/featured/communities'),
    clans: () => request('/featured/clans'),
  },
  documentVault: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
      return request<any>(`/document-vault?${q.toString()}`);
    },
    get: (id: string) => request(`/document-vault/${id}`),
    stats: () => request('/document-vault/stats'),
    trending: (limit?: number) => request(`/document-vault/analytics/trending?limit=${limit || 10}`),
    featured: (limit?: number) => request(`/document-vault/analytics/featured?limit=${limit || 10}`),
    verified: (limit?: number) => request(`/document-vault/analytics/verified?limit=${limit || 20}`),
    storageAnalytics: () => request('/document-vault/analytics/storage'),
    verifications: {
      review: (id: string, data: any) => request(`/document-vault/verifications/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
  },
  users: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
      return request<any>(`/users?${q.toString()}`);
    },
    getStats: () => request('/admin/stats'),
  },
};
