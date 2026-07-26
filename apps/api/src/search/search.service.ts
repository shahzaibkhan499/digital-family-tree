import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GlobalSearchParams {
  query: string;
  page?: number;
  limit?: number;
  type?: 'all' | 'users' | 'members' | 'families' | 'clans' | 'communities' | 'subclans';
}

export interface SearchResult {
  users: any[];
  members: any[];
  families: any[];
  clans: any[];
  communities: any[];
  subclans: any[];
  total: number;
}

export interface AdvancedMemberSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  birthYearStart?: number;
  birthYearEnd?: number;
  birthPlace?: string;
  city?: string;
  country?: string;
  clanId?: string;
  religion?: string;
  nationality?: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  soundex(word: string): string {
    if (!word) return '';

    const upper = word.toUpperCase().trim();
    const firstLetter = upper[0];
    const tail = upper.slice(1).replace(/[AEIOUYHW]/g, '');

    const map: Record<string, string> = {
      B: '1', F: '1', P: '1', V: '1',
      C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
      D: '3', T: '3',
      L: '4',
      M: '5', N: '5',
      R: '6',
    };

    let encoded = '';
    let previousCode = '';
    for (const ch of tail) {
      const code = map[ch];
      if (!code) {
        continue;
      }

      if (encoded.length === 0 && firstLetter === 'P' && ch === 'F') {
        continue;
      }

      if (code !== previousCode) {
        encoded += code;
        previousCode = code;
      }
    }

    return (firstLetter + encoded + '000').slice(0, 4);
  }

  levenshteinDistance(a: string, b: string): number {
    const lenA = a.length;
    const lenB = b.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= lenB; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= lenA; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= lenB; i++) {
      for (let j = 1; j <= lenA; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }
    return matrix[lenB][lenA];
  }

  async globalSearch(params: GlobalSearchParams): Promise<SearchResult> {
    const { query, page = 1, limit = 20, type = 'all' } = params;
    const skip = (page - 1) * limit;
    const trimmedQuery = query.trim();

    if (!trimmedQuery || trimmedQuery.length < 2) {
      return { users: [], members: [], families: [], clans: [], communities: [], subclans: [], total: 0 };
    }

    const results: SearchResult = { users: [], members: [], families: [], clans: [], communities: [], subclans: [], total: 0 };

    const isIdFormat = /^(USR|FAM|MEM|REL|INV|CLN)-\d{8}$/i.test(trimmedQuery);

    if (type === 'all' || type === 'users') {
      results.users = await this.searchUsers(trimmedQuery, isIdFormat, skip, limit);
    }

    if (type === 'all' || type === 'members') {
      results.members = await this.searchMembers(trimmedQuery, isIdFormat, skip, limit);
    }

    if (type === 'all' || type === 'families') {
      results.families = await this.searchFamilies(trimmedQuery, isIdFormat, skip, limit);
    }

    if (type === 'all' || type === 'clans') {
      results.clans = await this.searchClans(trimmedQuery, isIdFormat, skip, limit);
    }

    if (type === 'all' || type === 'communities') {
      results.communities = await this.searchCommunities(trimmedQuery, isIdFormat, skip, limit);
    }

    if (type === 'all' || type === 'subclans') {
      results.subclans = await this.searchSubclans(trimmedQuery, isIdFormat, skip, limit);
    }

    results.total = results.users.length + results.members.length + results.families.length + results.clans.length + results.communities.length + results.subclans.length;

    return results;
  }

  private async searchUsers(query: string, isIdFormat: boolean, skip: number, limit: number) {
    const where: any = {
      accountStatus: 'active',
      deletedAt: null,
      OR: [],
    };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { username: { contains: query, mode: 'insensitive' } },
      { profileSlug: { contains: query, mode: 'insensitive' } },
      { name: { contains: query, mode: 'insensitive' } },
      { displayName: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { country: { contains: query, mode: 'insensitive' } },
    );

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        name: true,
        displayName: true,
        username: true,
        profileSlug: true,
        avatar: true,
        city: true,
        country: true,
        occupation: true,
        createdAt: true,
        privacySettings: true,
      },
      skip,
      take: limit,
    });
  }

  private async searchMembers(query: string, isIdFormat: boolean, skip: number, limit: number) {
    const where: any = { OR: [] };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { middleName: { contains: query, mode: 'insensitive' } },
      { nickname: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { governmentId: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { country: { contains: query, mode: 'insensitive' } },
    );

    const querySoundex = this.soundex(query);
    if (querySoundex) {
      try {
        const rawIds: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
          `SELECT id FROM "FamilyMember" WHERE "deletedAt" IS NULL AND (soundex("firstName") = $1 OR soundex("lastName") = $1 OR levenshtein(LOWER("firstName"), LOWER($2)) <= 2 OR levenshtein(LOWER("lastName"), LOWER($2)) <= 2)`,
          querySoundex,
          query,
        );
        if (rawIds.length > 0) {
          where.OR.push({ id: { in: rawIds.map(r => r.id) } });
        }
      } catch {
        // fuzzystrmatch extension not available; soundex/levenshtein search disabled
      }
    }

    return this.prisma.familyMember.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        nickname: true,
        email: true,
        phone: true,
        governmentId: true,
        avatar: true,
        city: true,
        country: true,
        occupation: true,
        birthDate: true,
        gender: true,
        family: { select: { id: true, name: true, displayId: true } },
        createdAt: true,
      },
      skip,
      take: limit,
    });
  }

  private async searchFamilies(query: string, isIdFormat: boolean, skip: number, limit: number) {
    const where: any = { OR: [] };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    );

    return this.prisma.family.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        name: true,
        description: true,
        owner: { select: { id: true, name: true, email: true } },
        clan: { select: { id: true, name: true, slug: true } },
        _count: { select: { members: true } },
        createdAt: true,
      },
      skip,
      take: limit,
    });
  }

  async searchClans(query: string, isIdFormat: boolean, skip: number, limit: number) {
    const where: any = { OR: [] };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
      { country: { contains: query, mode: 'insensitive' } },
      { region: { contains: query, mode: 'insensitive' } },
    );

    return this.prisma.clan.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        name: true,
        slug: true,
        description: true,
        country: true,
        region: true,
        verified: true,
        logo: true,
        banner: true,
        _count: { select: { families: true } },
        owner: { select: { id: true, name: true, avatar: true } },
      },
      skip,
      take: limit,
    });
  }

  private async searchCommunities(query: string, isIdFormat: boolean, skip: number, limit: number) {
    const where: any = { OR: [] };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { origin: { contains: query, mode: 'insensitive' } },
    );

    return this.prisma.community.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        privacy: true,
        status: true,
      },
      skip,
      take: limit,
    });
  }

  private async searchSubclans(query: string, isIdFormat: boolean, skip: number, limit: number) {
    const where: any = { OR: [] };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { origin: { contains: query, mode: 'insensitive' } },
    );

    return this.prisma.subClan.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        privacy: true,
        status: true,
        clanId: true,
      },
      skip,
      take: limit,
    });
  }

  async findByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        accountStatus: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        displayId: true,
        name: true,
        displayName: true,
        username: true,
        profileSlug: true,
        avatar: true,
        city: true,
        country: true,
      },
    });

    return user;
  }

  async findByPhone(phone: string) {
    const normalizedPhone = phone.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        accountStatus: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        displayId: true,
        name: true,
        displayName: true,
        username: true,
        profileSlug: true,
        avatar: true,
      },
    });

    return user;
  }

  async enhancedSearch(params: GlobalSearchParams & { occupation?: string; company?: string; education?: string; tags?: string }): Promise<SearchResult & { relevanceScores?: { id: string; type: string; score: number }[] }> {
    const { query, page = 1, limit = 20, type = 'all', occupation, company, education, tags } = params;
    const skip = (page - 1) * limit;
    const trimmedQuery = query.trim();

    if (!trimmedQuery || trimmedQuery.length < 2) {
      return { users: [], members: [], families: [], clans: [], communities: [], subclans: [], total: 0, relevanceScores: [] };
    }

    const results: SearchResult = { users: [], members: [], families: [], clans: [], communities: [], subclans: [], total: 0 };
    const relevanceScores: { id: string; type: string; score: number }[] = [];

    const isIdFormat = /^(USR|FAM|MEM|REL|INV|CLN)-\d{8}$/i.test(trimmedQuery);

    if (type === 'all' || type === 'users') {
      const users = await this.searchEnhancedUsers(trimmedQuery, isIdFormat, skip, limit, { occupation, company, education });
      results.users = users.items;
      relevanceScores.push(...users.scores);
    }

    if (type === 'all' || type === 'members') {
      const members = await this.searchEnhancedMembers(trimmedQuery, isIdFormat, skip, limit, { occupation, tags });
      results.members = members.items;
      relevanceScores.push(...members.scores);
    }

    if (type === 'all' || type === 'families') {
      const families = await this.searchEnhancedFamilies(trimmedQuery, isIdFormat, skip, limit, { tags });
      results.families = families.items;
      relevanceScores.push(...families.scores);
    }

    if (type === 'all' || type === 'clans') {
      results.clans = await this.searchClans(trimmedQuery, isIdFormat, skip, limit);
    }

    if (type === 'all' || type === 'communities') {
      results.communities = await this.searchCommunities(trimmedQuery, isIdFormat, skip, limit);
    }

    if (type === 'all' || type === 'subclans') {
      results.subclans = await this.searchSubclans(trimmedQuery, isIdFormat, skip, limit);
    }

    results.total = results.users.length + results.members.length + results.families.length + results.clans.length + results.communities.length + results.subclans.length;

    return { ...results, relevanceScores };
  }

  private async searchEnhancedUsers(
    query: string,
    isIdFormat: boolean,
    skip: number,
    limit: number,
    filters: { occupation?: string; company?: string; education?: string },
  ) {
    const where: any = {
      accountStatus: 'active',
      deletedAt: null,
      OR: [],
    };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { name: { contains: query, mode: 'insensitive' } },
      { displayName: { contains: query, mode: 'insensitive' } },
      { username: { contains: query, mode: 'insensitive' } },
      { profileSlug: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { country: { contains: query, mode: 'insensitive' } },
      { occupation: { contains: query, mode: 'insensitive' } },
      { company: { contains: query, mode: 'insensitive' } },
      { education: { contains: query, mode: 'insensitive' } },
      { skills: { contains: query, mode: 'insensitive' } },
      { interests: { contains: query, mode: 'insensitive' } },
    );

    if (filters.occupation) {
      where.occupation = { contains: filters.occupation, mode: 'insensitive' };
    }
    if (filters.company) {
      where.company = { contains: filters.company, mode: 'insensitive' };
    }
    if (filters.education) {
      where.education = { contains: filters.education, mode: 'insensitive' };
    }

    const items = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        name: true,
        displayName: true,
        username: true,
        profileSlug: true,
        avatar: true,
        city: true,
        country: true,
        occupation: true,
        company: true,
        education: true,
        skills: true,
        interests: true,
        createdAt: true,
        privacySettings: true,
      },
      skip,
      take: limit,
    });

    const scores = items.map(item => ({
      id: item.id,
      type: 'user' as const,
      score: this.calculateRelevanceScore(query, {
        name: item.name,
        displayName: item.displayName,
        city: item.city,
        country: item.country,
        occupation: item.occupation,
        company: item.company,
        education: item.education,
        skills: item.skills,
        interests: item.interests,
      }),
    }));

    scores.sort((a, b) => b.score - a.score);

    return { items, scores };
  }

  private async searchEnhancedMembers(
    query: string,
    isIdFormat: boolean,
    skip: number,
    limit: number,
    filters: { occupation?: string; tags?: string },
  ) {
    const where: any = { OR: [] };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { middleName: { contains: query, mode: 'insensitive' } },
      { nickname: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { governmentId: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { country: { contains: query, mode: 'insensitive' } },
      { occupation: { contains: query, mode: 'insensitive' } },
      { bio: { contains: query, mode: 'insensitive' } },
      { notes: { contains: query, mode: 'insensitive' } },
    );

    if (filters.occupation) {
      where.occupation = { contains: filters.occupation, mode: 'insensitive' };
    }

    const items = await this.prisma.familyMember.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        nickname: true,
        email: true,
        phone: true,
        governmentId: true,
        avatar: true,
        city: true,
        country: true,
        occupation: true,
        bio: true,
        notes: true,
        birthDate: true,
        gender: true,
        family: { select: { id: true, name: true, displayId: true } },
        createdAt: true,
      },
      skip,
      take: limit,
    });

    const scores = items.map(item => ({
      id: item.id,
      type: 'member' as const,
      score: this.calculateRelevanceScore(query, {
        name: `${item.firstName} ${item.lastName}`,
        email: item.email,
        phone: item.phone,
        city: item.city,
        country: item.country,
        occupation: item.occupation,
        bio: item.bio,
      }),
    }));

    scores.sort((a, b) => b.score - a.score);

    return { items, scores };
  }

  private async searchEnhancedFamilies(
    query: string,
    isIdFormat: boolean,
    skip: number,
    limit: number,
    filters: { tags?: string },
  ) {
    const where: any = { OR: [] };

    if (isIdFormat) {
      where.OR.push({ displayId: query.toUpperCase() });
    }

    where.OR.push(
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    );

    const items = await this.prisma.family.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        name: true,
        description: true,
        owner: { select: { id: true, name: true, avatar: true } },
        clan: { select: { id: true, name: true, slug: true } },
        _count: { select: { members: true } },
        createdAt: true,
      },
      skip,
      take: limit,
    });

    const scores = items.map(item => ({
      id: item.id,
      type: 'family' as const,
      score: this.calculateRelevanceScore(query, {
        name: item.name,
        description: item.description,
      }),
    }));

    scores.sort((a, b) => b.score - a.score);

    return { items, scores };
  }

  private calculateRelevanceScore(query: string, fields: Record<string, string | null | undefined>): number {
    let score = 0;
    const lowerQuery = query.toLowerCase().trim();

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      if (!fieldValue) continue;

      const lowerValue = fieldValue.toLowerCase().trim();

      if (fieldName === 'name' || fieldName === 'displayName') {
        if (lowerValue === lowerQuery) {
          score += 100;
        } else if (lowerValue.startsWith(lowerQuery)) {
          score += 80;
        } else if (lowerValue.includes(lowerQuery)) {
          score += 60;
        }
      } else if (fieldName === 'email') {
        if (lowerValue === lowerQuery || lowerValue.startsWith(lowerQuery)) {
          score += 90;
        } else if (lowerValue.includes(lowerQuery)) {
          score += 50;
        }
      } else {
        if (lowerValue === lowerQuery) {
          score += 70;
        } else if (lowerValue.includes(lowerQuery)) {
          score += 40;
        }
      }
    }

    return score;
  }

  async findByGovernmentId(governmentId: string) {
    const normalizedId = governmentId.trim();

    const member = await this.prisma.familyMember.findFirst({
      where: { governmentId: normalizedId },
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        family: { select: { id: true, name: true } },
      },
    });

    return member;
  }

  async searchMembersAdvanced(params: AdvancedMemberSearchParams) {
    const {
      query,
      page = 1,
      limit = 20,
      birthYearStart,
      birthYearEnd,
      birthPlace,
      city,
      country,
      clanId,
      religion,
      nationality,
    } = params;
    const skip = (page - 1) * limit;
    const where: any = { AND: [] };

    const orConditions: any[] = [];

    if (query && query.trim().length >= 2) {
      const trimmedQuery = query.trim();
      orConditions.push(
        { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
        { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
        { middleName: { contains: trimmedQuery, mode: 'insensitive' } },
        { nickname: { contains: trimmedQuery, mode: 'insensitive' } },
        { email: { contains: trimmedQuery, mode: 'insensitive' } },
        { phone: { contains: trimmedQuery, mode: 'insensitive' } },
        { governmentId: { contains: trimmedQuery, mode: 'insensitive' } },
      );

      const querySoundex = this.soundex(trimmedQuery);
      if (querySoundex) {
        try {
          const rawIds: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
            `SELECT id FROM "FamilyMember" WHERE "deletedAt" IS NULL AND (soundex("firstName") = $1 OR soundex("lastName") = $1 OR levenshtein(LOWER("firstName"), LOWER($2)) <= 2 OR levenshtein(LOWER("lastName"), LOWER($2)) <= 2)`,
            querySoundex,
            trimmedQuery,
          );
          if (rawIds.length > 0) {
            orConditions.push({ id: { in: rawIds.map(r => r.id) } });
          }
        } catch {
          // fuzzystrmatch extension not available
        }
      }
    }

    if (orConditions.length > 0) {
      where.AND.push({ OR: orConditions });
    }

    if (birthYearStart || birthYearEnd) {
      const dateFilter: any = {};
      if (birthYearStart) dateFilter.gte = new Date(`${birthYearStart}-01-01T00:00:00.000Z`);
      if (birthYearEnd) dateFilter.lte = new Date(`${birthYearEnd}-12-31T23:59:59.999Z`);
      where.AND.push({ birthDate: dateFilter });
    }

    if (city) where.AND.push({ city: { contains: city, mode: 'insensitive' } });
    if (country) where.AND.push({ country: { contains: country, mode: 'insensitive' } });
    if (clanId) where.AND.push({ family: { clanId } });
    if (birthPlace) {
      where.AND.push({
        OR: [
          { city: { contains: birthPlace, mode: 'insensitive' } },
          { address: { contains: birthPlace, mode: 'insensitive' } },
        ],
      });
    }
    if (religion) {
      where.AND.push({
        OR: [
          { bio: { contains: religion, mode: 'insensitive' } },
          { notes: { contains: religion, mode: 'insensitive' } },
        ],
      });
    }
    if (nationality) {
      where.AND.push({
        OR: [
          { bio: { contains: nationality, mode: 'insensitive' } },
          { notes: { contains: nationality, mode: 'insensitive' } },
        ],
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    return this.prisma.familyMember.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        nickname: true,
        email: true,
        phone: true,
        governmentId: true,
        avatar: true,
        city: true,
        country: true,
        occupation: true,
        birthDate: true,
        gender: true,
        bio: true,
        address: true,
        family: { select: { id: true, name: true, displayId: true, clanId: true } },
        createdAt: true,
      },
      skip,
      take: limit,
    });
  }
}
