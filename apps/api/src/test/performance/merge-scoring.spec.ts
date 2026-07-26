import { Test, TestingModule } from '@nestjs/testing';
import { MergeService } from '../../merge/merge.service';
import { DuplicatesService } from '../../duplicates/duplicates.service';
import { PrismaService } from '../../prisma/prisma.service';
import { IdentityService } from '../../common/identity.service';
import { NotificationsEventService } from '../../notifications/notifications-event.service';
import { ActivityEventService } from '../../activities/activity-event.service';

const mockPrisma: Record<string, any> = {
  family: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  familyMember: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  duplicatePair: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  mergeSnapshot: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  familyMergeRequest: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  mergeAuditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  relationship: {
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  },
  timelineEvent: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((fn: (tx: any) => any) => fn(mockPrisma)),
};

const mockIdentityService = {
  generateDuplicatePairId: jest.fn().mockResolvedValue('DUP-00000001'),
  generateMemberId: jest.fn().mockResolvedValue('MEM-00000001'),
  generateMergeSnapshotId: jest.fn().mockResolvedValue('MRS-00000001'),
  generateRelationshipId: jest.fn().mockResolvedValue('REL-00000001'),
};

const mockNotificationsEvent = {
  emit: jest.fn().mockResolvedValue(undefined),
};

const mockActivityEvent = {
  emitMergeRequest: jest.fn().mockResolvedValue(undefined),
  emitMergeApproved: jest.fn().mockResolvedValue(undefined),
  emitMergeRejected: jest.fn().mockResolvedValue(undefined),
};

describe('MergeScoring - levenshteinSimilarity', () => {
  let mergeService: MergeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MergeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IdentityService, useValue: mockIdentityService },
        { provide: NotificationsEventService, useValue: mockNotificationsEvent },
        { provide: ActivityEventService, useValue: mockActivityEvent },
      ],
    }).compile();
    mergeService = module.get<MergeService>(MergeService);
  });

  it('exact match returns 1', () => {
    expect(mergeService.levenshteinSimilarity('john', 'john')).toBe(1);
  });

  it('distance 1 (substitution)', () => {
    const score = mergeService.levenshteinSimilarity('john', 'johb');
    expect(score).toBeGreaterThanOrEqual(0.75);
    expect(score).toBeLessThan(1);
  });

  it('distance 2 (two substitutions)', () => {
    const score = mergeService.levenshteinSimilarity('john', 'joxn');
    expect(score).toBeGreaterThanOrEqual(0.5);
    expect(score).toBeLessThan(1);
  });

  it('distance 3 (three substitutions)', () => {
    const score = mergeService.levenshteinSimilarity('john', 'abcd');
    expect(score).toBeLessThanOrEqual(0.5);
  });

  it('completely different strings return 0', () => {
    expect(mergeService.levenshteinSimilarity('abc', 'xyz')).toBe(0);
  });

  it('empty string returns 0', () => {
    expect(mergeService.levenshteinSimilarity('', 'test')).toBe(0);
    expect(mergeService.levenshteinSimilarity('test', '')).toBe(0);
  });
});

describe('MergeScoring - soundex', () => {
  let mergeService: MergeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MergeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IdentityService, useValue: mockIdentityService },
        { provide: NotificationsEventService, useValue: mockNotificationsEvent },
        { provide: ActivityEventService, useValue: mockActivityEvent },
      ],
    }).compile();
    mergeService = module.get<MergeService>(MergeService);
  });

  it('encodes "Robert" correctly', () => {
    expect(mergeService.soundex('Robert')).toBe('R163');
  });

  it('encodes "Rupert" as same as "Robert"', () => {
    expect(mergeService.soundex('Rupert')).toBe(mergeService.soundex('Robert'));
  });

  it('encodes "Ashcraft" correctly', () => {
    expect(mergeService.soundex('Ashcraft')).toBe('A261');
  });

  it('encodes "Smith" and "Smythe" to same code', () => {
    expect(mergeService.soundex('Smith')).toBe(mergeService.soundex('Smythe'));
  });

  it('encodes "Pfister" correctly', () => {
    expect(mergeService.soundex('Pfister')).toBe('P236');
  });

  it('empty string returns empty', () => {
    expect(mergeService.soundex('')).toBe('');
  });
});

describe('MergeScoring - calculateDuplicateScore', () => {
  let duplicatesService: DuplicatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuplicatesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IdentityService, useValue: mockIdentityService },
      ],
    }).compile();
    duplicatesService = module.get<DuplicatesService>(DuplicatesService);
  });

  it('matching first and last name gives at least 35', () => {
    const source = { firstName: 'John', lastName: 'Doe', birthDate: null, gender: null, email: null, phone: null, city: null, country: null, occupation: null };
    const target = { firstName: 'John', lastName: 'Doe', birthDate: null, gender: null, email: null, phone: null, city: null, country: null, occupation: null };
    const score = (duplicatesService as any).calculateDuplicateScore(source, target);
    expect(score).toBeGreaterThanOrEqual(35);
  });

  it('matching email gives 40+', () => {
    const source = { firstName: 'John', lastName: 'Smith', email: 'john@test.com', phone: null, birthDate: null, gender: null, city: null, country: null, occupation: null };
    const target = { firstName: 'Jane', lastName: 'Smith', email: 'john@test.com', phone: null, birthDate: null, gender: null, city: null, country: null, occupation: null };
    const score = (duplicatesService as any).calculateDuplicateScore(source, target);
    expect(score).toBeGreaterThanOrEqual(40);
  });

  it('different names but same city and country gives 20', () => {
    const source = { firstName: 'John', lastName: 'Doe', email: null, phone: null, birthDate: null, gender: null, city: 'New York', country: 'USA', occupation: null };
    const target = { firstName: 'Jane', lastName: 'Smith', email: null, phone: null, birthDate: null, gender: null, city: 'New York', country: 'USA', occupation: null };
    const score = (duplicatesService as any).calculateDuplicateScore(source, target);
    expect(score).toBe(20);
  });

  it('completely different records score 0', () => {
    const source = { firstName: 'Alice', lastName: 'Brown', email: null, phone: null, birthDate: null, gender: null, city: 'London', country: 'UK', occupation: null };
    const target = { firstName: 'Bob', lastName: 'Jones', email: null, phone: null, birthDate: null, gender: null, city: 'Paris', country: 'FR', occupation: null };
    const score = (duplicatesService as any).calculateDuplicateScore(source, target);
    expect(score).toBe(0);
  });

  it('score is capped at 100', () => {
    const source = { firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '1234567890', birthDate: new Date('1990-01-01'), gender: 'M', city: 'NYC', country: 'USA', occupation: 'Engineer' };
    const target = { firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '1234567890', birthDate: new Date('1990-01-01'), gender: 'M', city: 'NYC', country: 'USA', occupation: 'Engineer' };
    const score = (duplicatesService as any).calculateDuplicateScore(source, target);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('MergeScoring - calculateFieldDiff', () => {
  let mergeService: MergeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MergeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IdentityService, useValue: mockIdentityService },
        { provide: NotificationsEventService, useValue: mockNotificationsEvent },
        { provide: ActivityEventService, useValue: mockActivityEvent },
      ],
    }).compile();
    mergeService = module.get<MergeService>(MergeService);
  });

  it('conflicting fields are marked as conflict', () => {
    const source = { firstName: 'John', lastName: 'Doe', middleName: null, nickname: null, birthDate: new Date('1990-01-01'), deathDate: null, gender: 'M', bio: null, email: 'john@a.com', phone: null, whatsapp: null, address: null, city: 'NYC', country: 'USA', occupation: null, notes: null };
    const target = { firstName: 'John', lastName: 'Smith', middleName: null, nickname: null, birthDate: new Date('1991-05-15'), deathDate: null, gender: 'M', bio: null, email: 'john@b.com', phone: null, whatsapp: null, address: null, city: 'LA', country: 'USA', occupation: null, notes: null };
    const diff = mergeService.calculateFieldDiff(source, target);
    expect(diff.lastName.conflict).toBe(true);
    expect(diff.birthDate.conflict).toBe(true);
    expect(diff.email.conflict).toBe(true);
    expect(diff.city.conflict).toBe(true);
  });

  it('matching fields are not conflicts', () => {
    const source = { firstName: 'John', lastName: 'Doe', middleName: null, nickname: null, birthDate: new Date('1990-01-01'), deathDate: null, gender: 'M', bio: 'Person', email: 'john@test.com', phone: null, whatsapp: null, address: null, city: 'NYC', country: 'USA', occupation: 'Engineer', notes: null };
    const target = { firstName: 'John', lastName: 'Doe', middleName: null, nickname: null, birthDate: new Date('1990-01-01'), deathDate: null, gender: 'M', bio: 'Person', email: 'john@test.com', phone: null, whatsapp: null, address: null, city: 'NYC', country: 'USA', occupation: 'Engineer', notes: null };
    const diff = mergeService.calculateFieldDiff(source, target);
    expect(diff.firstName.conflict).toBe(false);
    expect(diff.lastName.conflict).toBe(false);
    expect(diff.email.conflict).toBe(false);
  });

  it('missing (null) fields do not cause conflict', () => {
    const source = { firstName: 'John', lastName: 'Doe', middleName: null, nickname: null, birthDate: null, deathDate: null, gender: null, bio: null, email: null, phone: null, whatsapp: null, address: null, city: null, country: null, occupation: null, notes: null };
    const target = { firstName: 'John', lastName: 'Doe', middleName: 'Middle', nickname: 'Johnny', birthDate: null, deathDate: null, gender: null, bio: null, email: 'test@test.com', phone: null, whatsapp: null, address: null, city: null, country: null, occupation: null, notes: null };
    const diff = mergeService.calculateFieldDiff(source, target);
    expect(diff.birthDate.conflict).toBe(false);
    expect(diff.middleName.conflict).toBe(false);
    expect(diff.nickname.conflict).toBe(false);
  });
});
