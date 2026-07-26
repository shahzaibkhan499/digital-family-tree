import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';

@Injectable()
export class DuplicatesService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

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

  async detectDuplicates(userId: string) {
    const userFamilies = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const userFamilyIds = userFamilies.map(f => f.id);

    if (userFamilyIds.length === 0) {
      return { duplicates: [], scanned: 0, newDuplicates: 0 };
    }

    const userMembers = await this.prisma.familyMember.findMany({
      where: { familyId: { in: userFamilyIds } },
      select: {
        id: true, firstName: true, lastName: true, birthDate: true,
        gender: true, email: true, phone: true, city: true, country: true,
        occupation: true, governmentId: true,
      },
    });

    const otherMembers = await this.prisma.familyMember.findMany({
      where: {
        familyId: { notIn: userFamilyIds },
      },
      include: {
        family: { select: { id: true, name: true, displayId: true, ownerId: true } },
      },
    });

    const existingPairs = await this.prisma.duplicatePair.findMany({
      select: { sourceMemberId: true, targetMemberId: true },
    });

    const existingPairKeys = new Set(
      existingPairs.map(p => `${p.sourceMemberId}:${p.targetMemberId}`),
    );

    const scanned = userMembers.length * otherMembers.length;
    const newDuplicates: any[] = [];

    for (const source of userMembers) {
      for (const target of otherMembers) {
        if (existingPairKeys.has(`${source.id}:${target.id}`)) continue;
        if (existingPairKeys.has(`${target.id}:${source.id}`)) continue;

        const score = this.calculateDuplicateScore(source, target);

        if (score >= 30) {
          const matchFactors = this.getMatchFactors(source, target);
          const displayId = await this.identityService.generateDuplicatePairId();

          const duplicate = await this.prisma.duplicatePair.create({
            data: {
              displayId,
              sourceMemberId: source.id,
              targetMemberId: target.id,
              confidenceScore: score,
              matchFactors,
              status: 'PENDING',
            },
            include: {
              sourceMember: {
                select: {
                  id: true, displayId: true, firstName: true, lastName: true,
                  email: true, phone: true, birthDate: true, gender: true, city: true, country: true,
                  family: { select: { id: true, name: true, displayId: true } },
                },
              },
              targetMember: {
                select: {
                  id: true, displayId: true, firstName: true, lastName: true,
                  email: true, phone: true, birthDate: true, gender: true, city: true, country: true,
                  family: { select: { id: true, name: true, displayId: true } },
                },
              },
            },
          });

          newDuplicates.push(duplicate);
        }
      }
    }

    return {
      duplicates: newDuplicates,
      scanned,
      newDuplicates: newDuplicates.length,
    };
  }

  async getDuplicateReports(userId: string, status?: string, minScore?: number) {
    const userFamilies = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const userFamilyIds = userFamilies.map(f => f.id);

    const where: any = {
      OR: [
        { sourceMember: { familyId: { in: userFamilyIds } } },
        { targetMember: { familyId: { in: userFamilyIds } } },
      ],
    };

    if (status) {
      where.status = status;
    }

    if (minScore !== undefined) {
      where.confidenceScore = { gte: minScore };
    }

    return this.prisma.duplicatePair.findMany({
      where,
      include: {
        sourceMember: {
          select: {
            id: true, displayId: true, firstName: true, lastName: true,
            email: true, phone: true, birthDate: true, gender: true, city: true, country: true,
            family: { select: { id: true, name: true, displayId: true } },
          },
        },
        targetMember: {
          select: {
            id: true, displayId: true, firstName: true, lastName: true,
            email: true, phone: true, birthDate: true, gender: true, city: true, country: true,
            family: { select: { id: true, name: true, displayId: true } },
          },
        },
      },
      orderBy: { confidenceScore: 'desc' },
    });
  }

  async getDuplicateById(id: string, userId: string) {
    const duplicate = await this.prisma.duplicatePair.findUnique({
      where: { id },
      include: {
        sourceMember: {
          select: {
            id: true, displayId: true, firstName: true, lastName: true, middleName: true,
            email: true, phone: true, birthDate: true, deathDate: true, gender: true,
            city: true, country: true, occupation: true, bio: true, avatar: true,
            family: { select: { id: true, name: true, displayId: true, ownerId: true } },
          },
        },
        targetMember: {
          select: {
            id: true, displayId: true, firstName: true, lastName: true, middleName: true,
            email: true, phone: true, birthDate: true, deathDate: true, gender: true,
            city: true, country: true, occupation: true, bio: true, avatar: true,
            family: { select: { id: true, name: true, displayId: true, ownerId: true } },
          },
        },
      },
    });

    if (!duplicate) {
      throw new NotFoundException('Duplicate pair not found');
    }

    const sourceFamilyOwner = duplicate.sourceMember.family.ownerId;
    const targetFamilyOwner = duplicate.targetMember.family.ownerId;

    if (sourceFamilyOwner !== userId && targetFamilyOwner !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return duplicate;
  }

  async reviewDuplicate(id: string, userId: string, action: 'APPROVED' | 'REJECTED') {
    const duplicate = await this.prisma.duplicatePair.findUnique({
      where: { id },
      include: {
        sourceMember: {
          select: {
            id: true, family: { select: { ownerId: true } },
          },
        },
        targetMember: {
          select: {
            id: true, family: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!duplicate) {
      throw new NotFoundException('Duplicate pair not found');
    }

    const sourceOwner = duplicate.sourceMember.family.ownerId;
    const targetOwner = duplicate.targetMember.family.ownerId;

    if (sourceOwner !== userId && targetOwner !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.duplicatePair.update({
      where: { id },
      data: {
        status: action,
        reviewedById: userId,
        reviewedAt: new Date(),
      },
      include: {
        sourceMember: {
          select: {
            id: true, displayId: true, firstName: true, lastName: true,
            family: { select: { id: true, name: true } },
          },
        },
        targetMember: {
          select: {
            id: true, displayId: true, firstName: true, lastName: true,
            family: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async getDuplicatesByFamily(familyId: string, userId: string) {
    const family = await this.prisma.family.findUnique({ where: { id: familyId } });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.duplicatePair.findMany({
      where: {
        OR: [
          { sourceMember: { familyId } },
          { targetMember: { familyId } },
        ],
      },
      include: {
        sourceMember: {
          select: {
            id: true, displayId: true, firstName: true, lastName: true,
            email: true, phone: true, birthDate: true, gender: true,
            family: { select: { id: true, name: true, displayId: true } },
          },
        },
        targetMember: {
          select: {
            id: true, displayId: true, firstName: true, lastName: true,
            email: true, phone: true, birthDate: true, gender: true,
            family: { select: { id: true, name: true, displayId: true } },
          },
        },
      },
      orderBy: { confidenceScore: 'desc' },
    });
  }

  private calculateDuplicateScore(source: any, target: any): number {
    let score = 0;

    const sourceFirstName = (source.firstName || '').toLowerCase().trim();
    const sourceLastName = (source.lastName || '').toLowerCase().trim();
    const targetFirstName = (target.firstName || '').toLowerCase().trim();
    const targetLastName = (target.lastName || '').toLowerCase().trim();

    const soundexSourceFirst = this.soundex(sourceFirstName);
    const soundexSourceLast = this.soundex(sourceLastName);
    const soundexTargetFirst = this.soundex(targetFirstName);
    const soundexTargetLast = this.soundex(targetLastName);

    const nameSoundexMatch =
      soundexSourceFirst && soundexTargetFirst &&
      soundexSourceLast && soundexTargetLast &&
      soundexSourceFirst === soundexTargetFirst &&
      soundexSourceLast === soundexTargetLast;

    const nameLevenshtein =
      this.levenshteinDistance(sourceFirstName, targetFirstName) <= 2 &&
      this.levenshteinDistance(sourceLastName, targetLastName) <= 2;

    if (
      sourceFirstName && targetFirstName &&
      sourceLastName && targetLastName &&
      (nameSoundexMatch || nameLevenshtein)
    ) {
      score += 35;
    }

    if (source.birthDate && target.birthDate) {
      const sourceDate = new Date(source.birthDate);
      const targetDate = new Date(target.birthDate);
      const sourceDateStr = sourceDate.toISOString().split('T')[0];
      const targetDateStr = targetDate.toISOString().split('T')[0];

      if (sourceDateStr === targetDateStr) {
        score += 15;
      } else {
        const sourceYear = sourceDate.getFullYear();
        const targetYear = targetDate.getFullYear();
        if (Math.abs(sourceYear - targetYear) <= 1) {
          score += 10;
        } else if (Math.floor(sourceYear / 10) === Math.floor(targetYear / 10)) {
          score += 5;
        }
      }
    }

    if (source.email && target.email && source.email.toLowerCase().trim() === target.email.toLowerCase().trim()) {
      score += 20;
    }

    if (source.phone && target.phone) {
      const sourcePhone = source.phone.replace(/\D/g, '');
      const targetPhone = target.phone.replace(/\D/g, '');
      if (sourcePhone === targetPhone && sourcePhone.length >= 7) {
        score += 15;
      }
    }

    if (source.city && target.city && source.city.toLowerCase().trim() === target.city.toLowerCase().trim()) {
      score += 10;
    }

    if (source.country && target.country && source.country.toLowerCase().trim() === target.country.toLowerCase().trim()) {
      score += 10;
    }

    if (source.governmentId && target.governmentId &&
        source.governmentId.trim().toLowerCase() === target.governmentId.trim().toLowerCase()) {
      score += 20;
    }

    if (source.occupation && target.occupation &&
        source.occupation.toLowerCase().trim() === target.occupation.toLowerCase().trim()) {
      score += 5;
    }

    if (source.gender && target.gender && source.gender.toLowerCase().trim() === target.gender.toLowerCase().trim()) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  private getMatchFactors(source: any, target: any): Record<string, any> {
    const factors: Record<string, any> = {};

    const sourceFirstName = (source.firstName || '').toLowerCase().trim();
    const sourceLastName = (source.lastName || '').toLowerCase().trim();
    const targetFirstName = (target.firstName || '').toLowerCase().trim();
    const targetLastName = (target.lastName || '').toLowerCase().trim();

    const soundexSourceFirst = this.soundex(sourceFirstName);
    const soundexSourceLast = this.soundex(sourceLastName);
    const soundexTargetFirst = this.soundex(targetFirstName);
    const soundexTargetLast = this.soundex(targetLastName);

    const nameSoundexMatch =
      soundexSourceFirst && soundexTargetFirst &&
      soundexSourceLast && soundexTargetLast &&
      soundexSourceFirst === soundexTargetFirst &&
      soundexSourceLast === soundexTargetLast;

    const nameLevenshtein =
      this.levenshteinDistance(sourceFirstName, targetFirstName) <= 2 &&
      this.levenshteinDistance(sourceLastName, targetLastName) <= 2;

    if (nameSoundexMatch || nameLevenshtein) {
      factors.nameMatch = { soundex: nameSoundexMatch, levenshtein: nameLevenshtein };
    }

    if (source.birthDate && target.birthDate) {
      const sourceDate = new Date(source.birthDate).toISOString().split('T')[0];
      const targetDate = new Date(target.birthDate).toISOString().split('T')[0];
      const sourceYear = new Date(source.birthDate).getFullYear();
      const targetYear = new Date(target.birthDate).getFullYear();

      if (sourceDate === targetDate) {
        factors.birthDateMatch = { type: 'exact', detail: 'Same date' };
      } else if (Math.abs(sourceYear - targetYear) <= 1) {
        factors.birthDateMatch = { type: 'year_approx', detail: `Within 1 year (${sourceYear} vs ${targetYear})` };
      } else if (Math.floor(sourceYear / 10) === Math.floor(targetYear / 10)) {
        factors.birthDateMatch = { type: 'decade', detail: `Same decade (${Math.floor(sourceYear / 10)}0s)` };
      }
    }

    if (source.gender && target.gender && source.gender.toLowerCase().trim() === target.gender.toLowerCase().trim()) {
      factors.genderMatch = true;
    }

    if (source.email && target.email && source.email.toLowerCase().trim() === target.email.toLowerCase().trim()) {
      factors.emailMatch = true;
    }

    if (source.phone && target.phone) {
      const sourcePhone = source.phone.replace(/\D/g, '');
      const targetPhone = target.phone.replace(/\D/g, '');
      if (sourcePhone === targetPhone && sourcePhone.length >= 7) {
        factors.phoneMatch = true;
      }
    }

    if (source.city && target.city && source.city.toLowerCase().trim() === target.city.toLowerCase().trim()) {
      factors.cityMatch = true;
    }

    if (source.country && target.country && source.country.toLowerCase().trim() === target.country.toLowerCase().trim()) {
      factors.countryMatch = true;
    }

    if (source.occupation && target.occupation &&
        source.occupation.toLowerCase().trim() === target.occupation.toLowerCase().trim()) {
      factors.occupationMatch = true;
    }

    if (source.governmentId && target.governmentId &&
        source.governmentId.trim().toLowerCase() === target.governmentId.trim().toLowerCase()) {
      factors.governmentIdMatch = true;
    }

    return factors;
  }

  async getDuplicateExplanation(pairId: string): Promise<{
    pairId: string;
    totalScore: number;
    breakdown: { factor: string; weight: number; contribution: number; detail: string }[];
    explanation: string;
  }> {
    const pair = await this.prisma.duplicatePair.findUnique({
      where: { id: pairId },
      include: {
        sourceMember: {
          select: {
            id: true, firstName: true, lastName: true, middleName: true, nickname: true,
            birthDate: true, gender: true, email: true, phone: true, city: true,
            country: true, occupation: true, governmentId: true,
          },
        },
        targetMember: {
          select: {
            id: true, firstName: true, lastName: true, middleName: true, nickname: true,
            birthDate: true, gender: true, email: true, phone: true, city: true,
            country: true, occupation: true, governmentId: true,
          },
        },
      },
    });

    if (!pair) {
      throw new NotFoundException('Duplicate pair not found');
    }

    const s = pair.sourceMember;
    const t = pair.targetMember;
    const breakdown: { factor: string; weight: number; contribution: number; detail: string }[] = [];

    const srcFirst = (s.firstName || '').toLowerCase().trim();
    const srcLast = (s.lastName || '').toLowerCase().trim();
    const tgtFirst = (t.firstName || '').toLowerCase().trim();
    const tgtLast = (t.lastName || '').toLowerCase().trim();

    const seFirst = this.soundex(srcFirst);
    const seLast = this.soundex(srcLast);
    const teFirst = this.soundex(tgtFirst);
    const teLast = this.soundex(tgtLast);

    const nameSoundex = seFirst && teFirst && seLast && teLast && seFirst === teFirst && seLast === teLast;
    const nameLev = this.levenshteinDistance(srcFirst, tgtFirst) <= 2 && this.levenshteinDistance(srcLast, tgtLast) <= 2;

    if (srcFirst && tgtFirst && srcLast && tgtLast && (nameSoundex || nameLev)) {
      let detail: string;
      if (nameSoundex && nameLev) {
        detail = `'${s.firstName} ${s.lastName}' matches '${t.firstName} ${t.lastName}' by Soundex and Levenshtein distance`;
      } else if (nameSoundex) {
        detail = `'${s.firstName} ${s.lastName}' phonetically matches '${t.firstName} ${t.lastName}' (Soundex: ${seFirst}${seLast})`;
      } else {
        detail = `'${s.firstName} ${s.lastName}' is within edit distance 2 of '${t.firstName} ${t.lastName}'`;
      }
      breakdown.push({ factor: 'Full Name', weight: 35, contribution: 35, detail });
    } else if (srcFirst && tgtFirst && srcLast && tgtLast) {
      breakdown.push({ factor: 'Full Name', weight: 35, contribution: 0, detail: 'Names do not match phonetically or within edit distance 2' });
    } else {
      breakdown.push({ factor: 'Full Name', weight: 35, contribution: 0, detail: 'Missing name data for comparison' });
    }

    if (s.birthDate && t.birthDate) {
      const sDate = new Date(s.birthDate);
      const tDate = new Date(t.birthDate);
      const sStr = sDate.toISOString().split('T')[0];
      const tStr = tDate.toISOString().split('T')[0];

      if (sStr === tStr) {
        breakdown.push({ factor: 'Birth Date', weight: 15, contribution: 15, detail: `Exact match: ${sStr}` });
      } else {
        const sYear = sDate.getFullYear();
        const tYear = tDate.getFullYear();
        if (Math.abs(sYear - tYear) <= 1) {
          breakdown.push({ factor: 'Birth Date', weight: 15, contribution: 10, detail: `Year proximity: ${sYear} vs ${tYear} (within 1 year)` });
        } else if (Math.floor(sYear / 10) === Math.floor(tYear / 10)) {
          breakdown.push({ factor: 'Birth Date', weight: 15, contribution: 5, detail: `Same decade: ${Math.floor(sYear / 10)}0s` });
        } else {
          breakdown.push({ factor: 'Birth Date', weight: 15, contribution: 0, detail: `No match: ${sStr} vs ${tStr}` });
        }
      }
    } else {
      breakdown.push({ factor: 'Birth Date', weight: 15, contribution: 0, detail: 'Missing birth date on one or both records' });
    }

    if (s.email && t.email && s.email.toLowerCase().trim() === t.email.toLowerCase().trim()) {
      breakdown.push({ factor: 'Email', weight: 20, contribution: 20, detail: `Email match: ${s.email}` });
    } else {
      breakdown.push({ factor: 'Email', weight: 20, contribution: 0, detail: s.email && t.email ? `No match: ${s.email} vs ${t.email}` : 'Missing email on one or both records' });
    }

    if (s.phone && t.phone) {
      const sPhone = s.phone.replace(/\D/g, '');
      const tPhone = t.phone.replace(/\D/g, '');
      if (sPhone === tPhone && sPhone.length >= 7) {
        breakdown.push({ factor: 'Phone', weight: 15, contribution: 15, detail: `Phone match (stripped): ${sPhone}` });
      } else {
        breakdown.push({ factor: 'Phone', weight: 15, contribution: 0, detail: `No match: ${s.phone} vs ${t.phone}` });
      }
    } else {
      breakdown.push({ factor: 'Phone', weight: 15, contribution: 0, detail: 'Missing phone on one or both records' });
    }

    if (s.city && t.city && s.city.toLowerCase().trim() === t.city.toLowerCase().trim()) {
      breakdown.push({ factor: 'City', weight: 10, contribution: 10, detail: `City match: ${s.city}` });
    } else {
      breakdown.push({ factor: 'City', weight: 10, contribution: 0, detail: s.city && t.city ? `No match: ${s.city} vs ${t.city}` : 'Missing city on one or both records' });
    }

    if (s.country && t.country && s.country.toLowerCase().trim() === t.country.toLowerCase().trim()) {
      breakdown.push({ factor: 'Country', weight: 10, contribution: 10, detail: `Country match: ${s.country}` });
    } else {
      breakdown.push({ factor: 'Country', weight: 10, contribution: 0, detail: s.country && t.country ? `No match: ${s.country} vs ${t.country}` : 'Missing country on one or both records' });
    }

    if (s.governmentId && t.governmentId &&
        s.governmentId.trim().toLowerCase() === t.governmentId.trim().toLowerCase()) {
      breakdown.push({ factor: 'Government ID', weight: 20, contribution: 20, detail: `Government ID match: ${s.governmentId}` });
    } else {
      breakdown.push({ factor: 'Government ID', weight: 20, contribution: 0, detail: s.governmentId && t.governmentId ? 'Government IDs present but do not match' : 'Missing government ID on one or both records' });
    }

    if (s.occupation && t.occupation &&
        s.occupation.toLowerCase().trim() === t.occupation.toLowerCase().trim()) {
      breakdown.push({ factor: 'Occupation', weight: 5, contribution: 5, detail: `Occupation match: ${s.occupation}` });
    } else {
      breakdown.push({ factor: 'Occupation', weight: 5, contribution: 0, detail: s.occupation && t.occupation ? `No match: ${s.occupation} vs ${t.occupation}` : 'Missing occupation on one or both records' });
    }

    if (s.gender && t.gender && s.gender.toLowerCase().trim() === t.gender.toLowerCase().trim()) {
      breakdown.push({ factor: 'Gender', weight: 5, contribution: 5, detail: `Gender match: ${s.gender}` });
    } else {
      breakdown.push({ factor: 'Gender', weight: 5, contribution: 0, detail: s.gender && t.gender ? `No match: ${s.gender} vs ${t.gender}` : 'Missing gender on one or both records' });
    }

    const totalScore = breakdown.reduce((sum, b) => sum + b.contribution, 0);

    const matched = breakdown.filter(b => b.contribution > 0);
    let explanation: string;
    if (matched.length === 0) {
      explanation = 'No matching factors found between these two members.';
    } else {
      const matchedDetails = matched.map(m => `${m.factor} (${m.contribution} pts)`).join(', ');
      explanation = `Score of ${totalScore}/100: matched ${matched.length} factor(s): ${matchedDetails}.`;
      if (totalScore >= 70) {
        explanation += ' High confidence duplicate.';
      } else if (totalScore >= 40) {
        explanation += ' Medium confidence duplicate.';
      } else {
        explanation += ' Low confidence duplicate.';
      }
    }

    return {
      pairId: pair.id,
      totalScore,
      breakdown,
      explanation,
    };
  }

  private levenshteinSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;

    const lenA = a.length;
    const lenB = b.length;

    if (lenA === 0) return 0;
    if (lenB === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= lenA; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= lenB; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    const maxLen = Math.max(lenA, lenB);
    return 1 - matrix[lenA][lenB] / maxLen;
  }
}
