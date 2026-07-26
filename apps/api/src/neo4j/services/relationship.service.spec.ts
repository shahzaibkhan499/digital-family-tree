import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '../neo4j.service';
import { CousinService } from './cousin.service';
import { PathService } from './path.service';
import { GraphTraversalService } from './graph-traversal.service';
import { RelationshipService } from './relationship.service';

const mockNeo4jService = {
  isConnected: jest.fn().mockReturnValue(true),
  readQuery: jest.fn().mockResolvedValue({ records: [] }),
  run: jest.fn().mockResolvedValue({ records: [] }),
  writeQuery: jest.fn().mockResolvedValue({ records: [] }),
  getDriver: jest.fn(),
  getSession: jest.fn(),
  close: jest.fn(),
};

const mockGraphTraversalService = {
  findShortestPath: jest.fn(),
  findNearestCommonAncestor: jest.fn(),
  findCommonAncestors: jest.fn(),
  getAncestors: jest.fn(),
  getDescendants: jest.fn(),
  getFamilyNetwork: jest.fn(),
  getAncestorChain: jest.fn(),
  countGenerations: jest.fn(),
  areConnected: jest.fn(),
};

describe('CousinService', () => {
  let service: CousinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CousinService,
        { provide: Neo4jService, useValue: mockNeo4jService },
      ],
    }).compile();
    service = module.get<CousinService>(CousinService);
  });

  describe('calculateDegree', () => {
    it('should return 1 for dA=2, dB=2', () => {
      expect(service.calculateDegree(2, 2)).toBe(1);
    });

    it('should return 2 for dA=3, dB=4', () => {
      expect(service.calculateDegree(3, 4)).toBe(2);
    });

    it('should return 1 for dA=2, dB=3', () => {
      expect(service.calculateDegree(2, 3)).toBe(1);
    });

    it('should return 3 for dA=5, dB=4', () => {
      expect(service.calculateDegree(5, 4)).toBe(3);
    });
  });

  describe('calculateRemoval', () => {
    it('should return 0 for dA=2, dB=2', () => {
      expect(service.calculateRemoval(2, 2)).toBe(0);
    });

    it('should return 1 for dA=3, dB=4', () => {
      expect(service.calculateRemoval(3, 4)).toBe(1);
    });

    it('should return 3 for dA=5, dB=2', () => {
      expect(service.calculateRemoval(5, 2)).toBe(3);
    });
  });

  describe('calculateCousin', () => {
    it('should return 1st Cousin for dA=2, dB=2', () => {
      const result = service.calculateCousin(2, 2);
      expect(result.degree).toBe(1);
      expect(result.removal).toBe(0);
      expect(result.label).toBe('1st Cousin');
    });

    it('should return 2nd Cousin Once Removed for dA=3, dB=4', () => {
      const result = service.calculateCousin(3, 4);
      expect(result.degree).toBe(2);
      expect(result.removal).toBe(1);
      expect(result.label).toBe('2nd Cousin Once Removed');
    });

    it('should return 1st Cousin Once Removed for dA=2, dB=3', () => {
      const result = service.calculateCousin(2, 3);
      expect(result.degree).toBe(1);
      expect(result.removal).toBe(1);
      expect(result.label).toBe('1st Cousin Once Removed');
    });

    it('should return 3rd Cousin Twice Removed for dA=4, dB=6', () => {
      const result = service.calculateCousin(4, 6);
      expect(result.degree).toBe(3);
      expect(result.removal).toBe(2);
      expect(result.label).toBe('3rd Cousin Twice Removed');
    });

    it('should return degree 0 for dA=1, dB=2', () => {
      const result = service.calculateCousin(1, 2);
      expect(result.degree).toBe(0);
      expect(result.removal).toBe(1);
      expect(result.label).toBe('Sibling');
    });

    it('should include commonAncestor when provided', () => {
      const result = service.calculateCousin(2, 2, { id: 'ca1', name: 'Alice' });
      expect(result.commonAncestor).toBeDefined();
      expect(result.commonAncestor!.id).toBe('ca1');
      expect(result.commonAncestor!.name).toBe('Alice');
      expect(result.commonAncestor!.distanceToA).toBe(2);
      expect(result.commonAncestor!.distanceToB).toBe(2);
    });
  });

  describe('ordinal', () => {
    it('should return correct ordinal suffixes', () => {
      expect(service.ordinal(1)).toBe('1st');
      expect(service.ordinal(2)).toBe('2nd');
      expect(service.ordinal(3)).toBe('3rd');
      expect(service.ordinal(4)).toBe('4th');
      expect(service.ordinal(11)).toBe('11th');
      expect(service.ordinal(12)).toBe('12th');
      expect(service.ordinal(13)).toBe('13th');
      expect(service.ordinal(21)).toBe('21st');
      expect(service.ordinal(22)).toBe('22nd');
      expect(service.ordinal(23)).toBe('23rd');
    });
  });

  describe('getCousinLabel', () => {
    it('should return correct label for each cousin degree', () => {
      expect(service.getCousinLabel(1, 0)).toBe('1st Cousin');
      expect(service.getCousinLabel(2, 0)).toBe('2nd Cousin');
      expect(service.getCousinLabel(3, 0)).toBe('3rd Cousin');
      expect(service.getCousinLabel(4, 0)).toBe('4th Cousin');
      expect(service.getCousinLabel(5, 0)).toBe('5th Cousin');
      expect(service.getCousinLabel(6, 0)).toBe('6th Cousin');
    });

    it('should return correct label for removed cousins', () => {
      expect(service.getCousinLabel(1, 1)).toBe('1st Cousin Once Removed');
      expect(service.getCousinLabel(1, 2)).toBe('1st Cousin Twice Removed');
      expect(service.getCousinLabel(1, 3)).toBe('1st Cousin 3 Times Removed');
      expect(service.getCousinLabel(2, 1)).toBe('2nd Cousin Once Removed');
    });

    it('should return Sibling for degree < 1', () => {
      expect(service.getCousinLabel(0, 0)).toBe('Sibling');
      expect(service.getCousinLabel(-1, 0)).toBe('Sibling');
    });
  });
});

describe('PathService', () => {
  let service: PathService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathService,
        { provide: Neo4jService, useValue: mockNeo4jService },
      ],
    }).compile();
    service = module.get<PathService>(PathService);
  });

  describe('getRelationshipLabel', () => {
    it('should return Father for PARENT_OF with male gender', () => {
      expect(service.getRelationshipLabel('PARENT_OF', 'male')).toBe('Father');
    });

    it('should return Mother for PARENT_OF with female gender', () => {
      expect(service.getRelationshipLabel('PARENT_OF', 'female')).toBe('Mother');
    });

    it('should return Parent for PARENT_OF without gender', () => {
      expect(service.getRelationshipLabel('PARENT_OF')).toBe('Parent');
    });

    it('should return Husband for MARRIED_TO with male gender', () => {
      expect(service.getRelationshipLabel('MARRIED_TO', 'male')).toBe('Husband');
    });

    it('should return Wife for MARRIED_TO with female gender', () => {
      expect(service.getRelationshipLabel('MARRIED_TO', 'female')).toBe('Wife');
    });

    it('should return Spouse for MARRIED_TO without gender', () => {
      expect(service.getRelationshipLabel('MARRIED_TO')).toBe('Spouse');
    });

    it('should return Son for CHILD_OF with male gender', () => {
      expect(service.getRelationshipLabel('CHILD_OF', 'male')).toBe('Son');
    });

    it('should return Daughter for CHILD_OF with female gender', () => {
      expect(service.getRelationshipLabel('CHILD_OF', 'female')).toBe('Daughter');
    });

    it('should return Child for CHILD_OF without gender', () => {
      expect(service.getRelationshipLabel('CHILD_OF')).toBe('Child');
    });

    it('should handle SIBLING_OF', () => {
      expect(service.getRelationshipLabel('SIBLING_OF', 'male')).toBe('Brother');
      expect(service.getRelationshipLabel('SIBLING_OF', 'female')).toBe('Sister');
      expect(service.getRelationshipLabel('SIBLING_OF')).toBe('Sibling');
    });

    it('should handle HALF_SIBLING_OF', () => {
      expect(service.getRelationshipLabel('HALF_SIBLING_OF', 'male')).toBe('Half Brother');
      expect(service.getRelationshipLabel('HALF_SIBLING_OF', 'female')).toBe('Half Sister');
      expect(service.getRelationshipLabel('HALF_SIBLING_OF')).toBe('Half Sibling');
    });

    it('should handle STEP_PARENT_OF', () => {
      expect(service.getRelationshipLabel('STEP_PARENT_OF', 'male')).toBe('Step Father');
      expect(service.getRelationshipLabel('STEP_PARENT_OF', 'female')).toBe('Step Mother');
      expect(service.getRelationshipLabel('STEP_PARENT_OF')).toBe('Step Parent');
    });

    it('should handle ADOPTED_BY', () => {
      expect(service.getRelationshipLabel('ADOPTED_BY', 'male')).toBe('Adoptive Father');
      expect(service.getRelationshipLabel('ADOPTED_BY', 'female')).toBe('Adoptive Mother');
      expect(service.getRelationshipLabel('ADOPTED_BY')).toBe('Adoptive Parent');
    });

    it('should handle ENGAGED_TO', () => {
      expect(service.getRelationshipLabel('ENGAGED_TO')).toBe('Fianc\u00e9');
    });

    it('should handle PARTNER_OF', () => {
      expect(service.getRelationshipLabel('PARTNER_OF')).toBe('Partner');
    });

    it('should handle DIVORCED_FROM', () => {
      expect(service.getRelationshipLabel('DIVORCED_FROM')).toBe('Ex-Spouse');
    });

    it('should handle FOSTER_PARENT_OF', () => {
      expect(service.getRelationshipLabel('FOSTER_PARENT_OF', 'male')).toBe('Foster Father');
      expect(service.getRelationshipLabel('FOSTER_PARENT_OF', 'female')).toBe('Foster Mother');
      expect(service.getRelationshipLabel('FOSTER_PARENT_OF')).toBe('Foster Parent');
    });

    it('should handle GUARDIAN_OF', () => {
      expect(service.getRelationshipLabel('GUARDIAN_OF')).toBe('Guardian');
    });

    it('should return formatted raw type for unknown types', () => {
      expect(service.getRelationshipLabel('CUSTOM_REL')).toBe('CUSTOM REL');
      expect(service.getRelationshipLabel('SOMETHING_ELSE')).toBe('SOMETHING ELSE');
    });
  });

  describe('reverseRelationshipType', () => {
    it('should reverse PARENT_OF to CHILD_OF', () => {
      expect(service.reverseRelationshipType('PARENT_OF')).toBe('CHILD_OF');
    });

    it('should reverse CHILD_OF to PARENT_OF', () => {
      expect(service.reverseRelationshipType('CHILD_OF')).toBe('PARENT_OF');
    });

    it('should keep MARRIED_TO as MARRIED_TO', () => {
      expect(service.reverseRelationshipType('MARRIED_TO')).toBe('MARRIED_TO');
    });

    it('should keep DIVORCED_FROM as DIVORCED_FROM', () => {
      expect(service.reverseRelationshipType('DIVORCED_FROM')).toBe('DIVORCED_FROM');
    });

    it('should keep SIBLING_OF as SIBLING_OF', () => {
      expect(service.reverseRelationshipType('SIBLING_OF')).toBe('SIBLING_OF');
    });

    it('should reverse STEP_PARENT_OF to STEP_CHILD_OF', () => {
      expect(service.reverseRelationshipType('STEP_PARENT_OF')).toBe('STEP_CHILD_OF');
    });

    it('should reverse ADOPTED_BY to ADOPTED', () => {
      expect(service.reverseRelationshipType('ADOPTED_BY')).toBe('ADOPTED');
    });

    it('should return same type for unknown types', () => {
      expect(service.reverseRelationshipType('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
    });
  });

  describe('analyzePath', () => {
    it('should analyze a blood-only path', () => {
      const result = service.analyzePath(['PARENT_OF', 'PARENT_OF', 'PARENT_OF']);
      expect(result.totalSteps).toBe(3);
      expect(result.bloodSteps).toBe(3);
      expect(result.marriageSteps).toBe(0);
      expect(result.adoptionSteps).toBe(0);
      expect(result.stepSteps).toBe(0);
      expect(result.hasAdoption).toBe(false);
      expect(result.hasStepRelation).toBe(false);
      expect(result.hasMultipleMarriages).toBe(false);
    });

    it('should detect marriage in path', () => {
      const result = service.analyzePath(['PARENT_OF', 'MARRIED_TO', 'PARENT_OF']);
      expect(result.totalSteps).toBe(3);
      expect(result.bloodSteps).toBe(2);
      expect(result.marriageSteps).toBe(1);
      expect(result.hasMultipleMarriages).toBe(false);
    });

    it('should detect adoption in path', () => {
      const result = service.analyzePath(['ADOPTED_BY', 'PARENT_OF']);
      expect(result.hasAdoption).toBe(true);
      expect(result.adoptionSteps).toBe(1);
    });

    it('should detect step relations in path', () => {
      const result = service.analyzePath(['STEP_PARENT_OF', 'PARENT_OF']);
      expect(result.hasStepRelation).toBe(true);
      expect(result.stepSteps).toBe(1);
    });

    it('should detect multiple marriages', () => {
      const result = service.analyzePath(['MARRIED_TO', 'MARRIED_TO', 'PARENT_OF']);
      expect(result.hasMultipleMarriages).toBe(true);
      expect(result.marriageSteps).toBe(2);
    });

    it('should detect half sibling in blood types', () => {
      const result = service.analyzePath(['HALF_SIBLING_OF', 'PARENT_OF']);
      expect(result.bloodSteps).toBe(2);
      expect(result.totalSteps).toBe(2);
    });

    it('should detect engaged and partner as marriage types', () => {
      const result = service.analyzePath(['ENGAGED_TO', 'PARTNER_OF']);
      expect(result.marriageSteps).toBe(2);
      expect(result.hasMultipleMarriages).toBe(true);
    });

    it('should return zeros for empty path', () => {
      const result = service.analyzePath([]);
      expect(result.totalSteps).toBe(0);
      expect(result.bloodSteps).toBe(0);
      expect(result.marriageSteps).toBe(0);
      expect(result.hasAdoption).toBe(false);
      expect(result.hasMultipleMarriages).toBe(false);
    });
  });
});

describe('RelationshipService', () => {
  let service: RelationshipService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationshipService,
        { provide: Neo4jService, useValue: mockNeo4jService },
        { provide: GraphTraversalService, useValue: mockGraphTraversalService },
        CousinService,
        PathService,
      ],
    }).compile();
    service = module.get<RelationshipService>(RelationshipService);
  });

  describe('classifyRelationship', () => {
    describe('direct ancestor/descendant', () => {
      it('should identify Parent (dA=0, dB=1)', async () => {
        const result = await (service as any).classifyRelationship(
          0, 1, ['PARENT_OF'], ['a', 'b'],
        );
        expect(result.relationshipType).toBe('PARENT');
        expect(result.relationshipLabel).toBe('Parent');
        expect(result.category).toBe('blood');
        expect(result.degree).toBe(0);
        expect(result.removal).toBe(0);
      });

      it('should identify Child (dA=1, dB=0)', async () => {
        const result = await (service as any).classifyRelationship(
          1, 0, ['CHILD_OF'], ['a', 'b'],
        );
        expect(result.relationshipType).toBe('CHILD');
        expect(result.relationshipLabel).toBe('Child');
        expect(result.category).toBe('blood');
      });

      it('should identify Grandparent (dA=0, dB=2)', async () => {
        const result = await (service as any).classifyRelationship(
          0, 2, ['PARENT_OF', 'PARENT_OF'], ['a', 'b', 'c'],
        );
        expect(result.relationshipType).toBe('GRANDPARENT');
        expect(result.relationshipLabel).toBe('Grandparent');
        expect(result.degree).toBe(0);
        expect(result.removal).toBe(1);
      });

      it('should identify Great Grandparent (dA=0, dB=3)', async () => {
        const result = await (service as any).classifyRelationship(
          0, 3, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF'], ['a', 'b', 'c', 'd'],
        );
        expect(result.relationshipType).toBe('GREAT_GRANDPARENT');
        expect(result.relationshipLabel).toBe('Great Grandparent');
        expect(result.removal).toBe(2);
      });

      it('should identify 2nd Great Grandparent (dA=0, dB=4)', async () => {
        const result = await (service as any).classifyRelationship(
          0, 4, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
          ['a', 'b', 'c', 'd', 'e'],
        );
        expect(result.relationshipLabel).toBe('2nd Great Grandparent');
        expect(result.degree).toBe(0);
        expect(result.removal).toBe(3);
      });

      it('should identify 2nd Great Grandchild (dA=4, dB=0)', async () => {
        const result = await (service as any).classifyRelationship(
          4, 0, ['CHILD_OF', 'CHILD_OF', 'CHILD_OF', 'CHILD_OF'],
          ['a', 'b', 'c', 'd', 'e'],
        );
        expect(result.relationshipLabel).toBe('2nd Great Grandchild');
        expect(result.relationshipType).toBe('GREAT_GRANDCHILD');
        expect(result.removal).toBe(3);
      });

      it('should identify 3rd Great Grandparent (dA=0, dB=5)', async () => {
        const result = await (service as any).classifyRelationship(
          0, 5, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
          ['a', 'b', 'c', 'd', 'e', 'f'],
        );
        expect(result.relationshipLabel).toBe('3rd Great Grandparent');
        expect(result.removal).toBe(4);
      });
    });

    describe('sibling', () => {
      it('should identify Sibling (dA=1, dB=1)', async () => {
        const result = await (service as any).classifyRelationship(
          1, 1, ['PARENT_OF'], ['a', 'ca', 'b'],
        );
        expect(result.relationshipType).toBe('SIBLING');
        expect(result.relationshipLabel).toBe('Sibling');
        expect(result.category).toBe('blood');
        expect(result.degree).toBe(0);
        expect(result.removal).toBe(0);
      });
    });

    describe('avuncular', () => {
      it('should identify Aunt/Uncle (dA=1, dB=2)', async () => {
        const result = await (service as any).classifyRelationship(
          1, 2, ['PARENT_OF', 'PARENT_OF'],
          ['self', 'parent', 'grandparent', 'aunt'],
        );
        expect(result.relationshipType).toBe('AVUNCULAR');
        expect(result.relationshipLabel).toBe('Aunt/Uncle');
        expect(result.degree).toBe(0);
        expect(result.removal).toBe(1);
      });

      it('should identify Great Aunt/Uncle (dA=1, dB=3)', async () => {
        const result = await (service as any).classifyRelationship(
          1, 3, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
          ['self', 'parent', 'grandparent', 'great-grandparent', 'great-aunt'],
        );
        expect(result.relationshipType).toBe('AVUNCULAR');
        expect(result.relationshipLabel).toBe('Great Aunt/Uncle');
        expect(result.removal).toBe(2);
      });

      it('should identify Niece/Nephew (dA=2, dB=1)', async () => {
        const result = await (service as any).classifyRelationship(
          2, 1, ['PARENT_OF', 'PARENT_OF'], ['a', 'b', 'c'],
        );
        expect(result.relationshipType).toBe('AVUNCULAR');
        expect(result.relationshipLabel).toBe('Niece/Nephew');
        expect(result.degree).toBe(0);
        expect(result.removal).toBe(1);
      });

      it('should identify Great Niece/Nephew (dA=3, dB=1)', async () => {
        const result = await (service as any).classifyRelationship(
          3, 1, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF'], ['a', 'b', 'c', 'd'],
        );
        expect(result.relationshipType).toBe('AVUNCULAR');
        expect(result.relationshipLabel).toBe('Great Niece/Nephew');
        expect(result.removal).toBe(2);
      });

      it('should handle higher removal avuncular with repeated Great prefix', async () => {
        const result = await (service as any).classifyRelationship(
          1, 4, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
          ['a', 'b', 'c', 'd', 'e'],
        );
        expect(result.relationshipType).toBe('AVUNCULAR');
        expect(result.relationshipLabel).toBe('Great Great Aunt/Uncle');
        expect(result.removal).toBe(3);
      });
    });

    describe('cousin', () => {
      it('should identify 1st Cousin (dA=2, dB=2)', async () => {
        const result = await (service as any).classifyRelationship(
          2, 2, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
          ['a', 'b', 'ca', 'c', 'd'],
        );
        expect(result.relationshipType).toBe('COUSIN');
        expect(result.relationshipLabel).toBe('1st Cousin');
        expect(result.degree).toBe(1);
        expect(result.removal).toBe(0);
      });

      it('should identify 2nd Cousin (dA=3, dB=3)', async () => {
        const result = await (service as any).classifyRelationship(
          3, 3, [], ['a', 'b', 'c', 'ca', 'd', 'e'],
        );
        expect(result.relationshipLabel).toBe('2nd Cousin');
        expect(result.degree).toBe(2);
        expect(result.removal).toBe(0);
      });

      it('should identify 1st Cousin Once Removed (dA=2, dB=3)', async () => {
        const result = await (service as any).classifyRelationship(
          2, 3, [], ['a', 'b', 'ca', 'c', 'd'],
        );
        expect(result.relationshipLabel).toBe('1st Cousin Once Removed');
        expect(result.degree).toBe(1);
        expect(result.removal).toBe(1);
      });

      it('should identify 1st Cousin Twice Removed (dA=2, dB=4)', async () => {
        const result = await (service as any).classifyRelationship(
          2, 4, [], ['a', 'b', 'ca', 'c', 'd'],
        );
        expect(result.relationshipLabel).toBe('1st Cousin Twice Removed');
        expect(result.degree).toBe(1);
        expect(result.removal).toBe(2);
      });

      it('should identify 3rd Cousin (dA=4, dB=4)', async () => {
        const result = await (service as any).classifyRelationship(
          4, 4, [], ['a', 'b', 'c', 'd', 'ca', 'e', 'f'],
        );
        expect(result.relationshipLabel).toBe('3rd Cousin');
        expect(result.degree).toBe(3);
        expect(result.removal).toBe(0);
      });

      it('should identify 2nd Cousin Once Removed (dA=3, dB=4)', async () => {
        const result = await (service as any).classifyRelationship(
          3, 4, [], ['a', 'b', 'c', 'ca', 'd', 'e'],
        );
        expect(result.relationshipLabel).toBe('2nd Cousin Once Removed');
        expect(result.degree).toBe(2);
        expect(result.removal).toBe(1);
      });
    });

    describe('category classification', () => {
      it('should identify blood relation from PARENT_OF edges', async () => {
        const result = await (service as any).classifyRelationship(
          1, 1, ['PARENT_OF'], ['a', 'ca', 'b'],
        );
        expect(result.category).toBe('blood');
      });

      it('should identify adoption from ADOPTED_BY edges', async () => {
        const result = await (service as any).classifyRelationship(
          1, 1, ['ADOPTED_BY'], ['a', 'ca', 'b'],
        );
        expect(result.category).toBe('adoption');
      });

      it('should identify step from STEP_PARENT_OF edges', async () => {
        const result = await (service as any).classifyRelationship(
          1, 1, ['STEP_PARENT_OF'], ['a', 'ca', 'b'],
        );
        expect(result.category).toBe('step');
      });

      it('should identify marriage from MARRIED_TO edges', async () => {
        const result = await (service as any).classifyRelationship(
          1, 1, ['MARRIED_TO'], ['a', 'ca', 'b'],
        );
        expect(result.category).toBe('marriage');
      });

      it('should identify foster from FOSTER_PARENT_OF edges', async () => {
        const result = await (service as any).classifyRelationship(
          1, 1, ['FOSTER_PARENT_OF'], ['a', 'ca', 'b'],
        );
        expect(result.category).toBe('foster');
      });

      it('should identify legal from GUARDIAN_OF edges', async () => {
        const result = await (service as any).classifyRelationship(
          1, 1, ['GUARDIAN_OF'], ['a', 'ca', 'b'],
        );
        expect(result.category).toBe('legal');
      });

      it('should return unknown for empty edge types', async () => {
        const result = await (service as any).classifyRelationship(
          2, 2, [], ['a', 'b', 'ca', 'c', 'd'],
        );
        expect(result.category).toBe('unknown');
      });
    });

    describe('edge cases', () => {
      it('should return Sibling for dA=1, dB=1 with empty path', async () => {
        const result = await (service as any).classifyRelationship(
          1, 1, [], ['a', 'b'],
        );
        expect(result.relationshipType).toBe('SIBLING');
        expect(result.relationshipLabel).toBe('Sibling');
      });

      it('should handle large generation gap with deg=0, dB>5', async () => {
        const result = await (service as any).classifyRelationship(
          0, 7, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        );
        expect(result.relationshipLabel).toBe('5th Great Grandparent');
        expect(result.removal).toBe(6);
      });

      it('should handle large avuncular removal with Nx Great prefix', async () => {
        const result = await (service as any).classifyRelationship(
          1, 5, ['PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
          ['a', 'b', 'c', 'd', 'e', 'f'],
        );
        expect(result.relationshipType).toBe('AVUNCULAR');
        expect(result.relationshipLabel).toBe('3x Great Aunt/Uncle');
      });
    });
  });

  describe('RelationshipService.calculateConfidence', () => {
    it('should return 100 for direct parent-child (dA=0)', () => {
      const result = (service as any).calculateConfidence(['PARENT_OF'], 0, 1);
      expect(result).toBe(100);
    });

    it('should return 100 for direct descendant (dB=0)', () => {
      const result = (service as any).calculateConfidence(['CHILD_OF'], 1, 0);
      expect(result).toBe(100);
    });

    it('should return 100 for siblings (dA=1, dB=1)', () => {
      const result = (service as any).calculateConfidence(['PARENT_OF'], 1, 1);
      expect(result).toBe(100);
    });

    it('should deduct 10 for adoption', () => {
      const result = (service as any).calculateConfidence(['ADOPTED_BY', 'PARENT_OF'], 2, 1);
      expect(result).toBe(90);
    });

    it('should deduct 15 for step relation', () => {
      const result = (service as any).calculateConfidence(['STEP_PARENT_OF', 'PARENT_OF'], 2, 1);
      expect(result).toBe(85);
    });

    it('should deduct 20 for foster', () => {
      const result = (service as any).calculateConfidence(['FOSTER_PARENT_OF'], 2, 2);
      expect(result).toBe(80);
    });

    it('should deduct 5 for marriage hops', () => {
      const result = (service as any).calculateConfidence(['MARRIED_TO', 'PARENT_OF'], 2, 1);
      expect(result).toBe(95);
    });

    it('should deduct additional for long paths (>10 steps total)', () => {
      const edgeTypes = Array(12).fill('PARENT_OF');
      const result = (service as any).calculateConfidence(edgeTypes, 6, 6);
      expect(result).toBe(85);
    });

    it('should not go below 0', () => {
      const edgeTypes = Array(20).fill('STEP_PARENT_OF');
      const result = (service as any).calculateConfidence(edgeTypes, 10, 10);
      expect(result).toBe(0);
    });

    it('should handle mixed edge types correctly', () => {
      const result = (service as any).calculateConfidence(
        ['MARRIED_TO', 'ADOPTED_BY', 'STEP_PARENT_OF'],
        2, 2,
      );
      expect(result).toBe(70);
    });

    it('should deduct -5 for total steps > 5', () => {
      const edgeTypes = Array(7).fill('PARENT_OF');
      const result = (service as any).calculateConfidence(edgeTypes, 4, 3);
      expect(result).toBe(95);
    });

    it('should deduct -15 total for steps > 10 (cumulative -5 + -10)', () => {
      const edgeTypes = Array(12).fill('PARENT_OF');
      const result = (service as any).calculateConfidence(edgeTypes, 5, 6);
      expect(result).toBe(85);
    });
  });
});

describe('Relationship edge cases', () => {
  let service: RelationshipService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationshipService,
        { provide: Neo4jService, useValue: mockNeo4jService },
        { provide: GraphTraversalService, useValue: mockGraphTraversalService },
        CousinService,
        PathService,
      ],
    }).compile();
    service = module.get<RelationshipService>(RelationshipService);
  });

  describe('Deep cousin relationships', () => {
    it('should handle 5th cousin (dA=6, dB=6)', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 12, nodeIds: Array(13).fill('x'), relationshipTypes: Array(12).fill('PARENT_OF'),
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'ca', name: 'Common', distanceFromA: 6, distanceFromB: 6, combinedDistance: 12 },
      });
      const result = await service.calculateRelationship('a', 'b');
      expect(result.found).toBe(true);
      expect(result.relationshipLabel).toContain('5th Cousin');
    });

    it('should handle 6th cousin (dA=7, dB=7)', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 14, nodeIds: Array(15).fill('x'), relationshipTypes: Array(14).fill('PARENT_OF'),
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'ca', name: 'Common', distanceFromA: 7, distanceFromB: 7, combinedDistance: 14 },
      });
      const result = await service.calculateRelationship('a', 'b');
      expect(result.found).toBe(true);
      expect(result.relationshipLabel).toBe('6th Cousin');
    });

    it('should handle 10th cousin (dA=11, dB=11)', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 22, nodeIds: Array(23).fill('x'), relationshipTypes: Array(22).fill('PARENT_OF'),
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'ca', name: 'Common', distanceFromA: 11, distanceFromB: 11, combinedDistance: 22 },
      });
      const result = await service.calculateRelationship('a', 'b');
      expect(result.found).toBe(true);
      expect(result.relationshipLabel).toBe('10th Cousin');
    });
  });

  describe('Multiple marriage paths', () => {
    it('should handle step-relations through multiple marriages', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 3, nodeIds: ['a', 'b', 'c', 'd'], relationshipTypes: ['MARRIED_TO', 'STEP_PARENT_OF', 'PARENT_OF'],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'c', name: 'C', distanceFromA: 2, distanceFromB: 1, combinedDistance: 3 },
      });
      const result = await service.calculateRelationship('a', 'd');
      expect(result.found).toBe(true);
      expect(result.relationshipCategory).toBe('step');
      expect(result.confidence).toBeLessThan(100);
    });
  });

  describe('Half-sibling through common parent', () => {
    it('should identify half-sibling (dA=1, dB=1 with one shared parent)', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 2, nodeIds: ['a', 'ca', 'b'], relationshipTypes: ['PARENT_OF'],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'ca', name: 'Common', distanceFromA: 1, distanceFromB: 1, combinedDistance: 2 },
      });
      const result = await service.calculateRelationship('a', 'b');
      expect(result.found).toBe(true);
      expect(result.relationshipLabel).toBe('Sibling');
      expect(result.relationshipCategory).toBe('blood');
    });
  });

  describe('Adopted child relationships', () => {
    it('should identify adoptive relationship', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 1, nodeIds: ['parent', 'child'], relationshipTypes: ['ADOPTED_BY'],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'parent', name: 'Parent', distanceFromA: 0, distanceFromB: 1, combinedDistance: 1 },
      });
      const result = await service.calculateRelationship('parent', 'child');
      expect(result.found).toBe(true);
      expect(result.relationshipCategory).toBe('adoption');
    });

    it('should handle adopted child as Child relationship', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 1, nodeIds: ['parent', 'child'], relationshipTypes: ['ADOPTED_BY'],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'parent', name: 'Parent', distanceFromA: 0, distanceFromB: 1, combinedDistance: 1 },
      });
      const result = await service.calculateRelationship('child', 'parent');
      expect(result.found).toBe(true);
      expect(result.relationshipLabel).toBe('Parent');
      expect(result.relationshipCategory).toBe('adoption');
    });
  });

  describe('Foster parent relationships', () => {
    it('should identify foster relationship', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 1, nodeIds: ['a', 'b'], relationshipTypes: ['FOSTER_PARENT_OF'],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'a', name: 'A', distanceFromA: 0, distanceFromB: 1, combinedDistance: 1 },
      });
      const result = await service.calculateRelationship('a', 'b');
      expect(result.found).toBe(true);
      expect(result.relationshipCategory).toBe('foster');
    });
  });

  describe('Legal guardian relationships', () => {
    it('should identify guardian relationship', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 1, nodeIds: ['guardian', 'ward'], relationshipTypes: ['GUARDIAN_OF'],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'guardian', name: 'Guardian', distanceFromA: 0, distanceFromB: 1, combinedDistance: 1 },
      });
      const result = await service.calculateRelationship('guardian', 'ward');
      expect(result.found).toBe(true);
      expect(result.relationshipCategory).toBe('legal');
    });
  });

  describe('Extremely deep ancestry', () => {
    it('should handle generation 20+ relationships', async () => {
      const nodeIds = Array(25).fill('x').map((_, i) => `n${i}`);
      const edgeTypes = Array(24).fill('PARENT_OF');
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 24, nodeIds, relationshipTypes: edgeTypes,
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'ca', name: 'Common', distanceFromA: 0, distanceFromB: 24, combinedDistance: 24 },
      });
      const result = await service.calculateRelationship('a', 'b');
      expect(result.found).toBe(true);
      expect(result.relationshipLabel).toContain('Great Grandparent');
    });
  });

  describe('Single-parent families', () => {
    it('should handle single-parent relationship', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 1, nodeIds: ['child', 'parent'], relationshipTypes: ['PARENT_OF'],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'parent', name: 'Parent', distanceFromA: 1, distanceFromB: 0, combinedDistance: 1 },
      });
      const result = await service.calculateRelationship('child', 'parent');
      expect(result.found).toBe(true);
      expect(result.relationshipLabel).toBe('Child');
      expect(result.confidence).toBe(100);
    });
  });

  describe('No common ancestor found', () => {
    it('should return found=false when no path exists', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: false, path: [], distance: 0, nodeIds: [], relationshipTypes: [],
      });
      const result = await service.calculateRelationship('a', 'b');
      expect(result.found).toBe(false);
    });

    it('should return found=true even without NCA, using path-based fallback', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 2, nodeIds: ['a', 'b', 'c'], relationshipTypes: ['PARENT_OF', 'PARENT_OF'],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: false,
      });
      const result = await service.calculateRelationship('a', 'c');
      expect(result.found).toBe(true);
    });
  });

  describe('Self-relationship', () => {
    it('should return SELF when personA === personB', async () => {
      const result = await service.calculateRelationship('same', 'same');
      expect(result.found).toBe(true);
      expect(result.relationshipType).toBe('SELF');
      expect(result.relationshipLabel).toBe('Self');
      expect(result.confidence).toBe(100);
    });
  });

  describe('Empty path edges', () => {
    it('should handle empty edge types gracefully', async () => {
      mockGraphTraversalService.findShortestPath.mockResolvedValue({
        found: true, path: [], distance: 0, nodeIds: ['a', 'ca', 'b'], relationshipTypes: [],
      });
      mockGraphTraversalService.findNearestCommonAncestor.mockResolvedValue({
        found: true, ancestor: { id: 'ca', name: 'Common', distanceFromA: 1, distanceFromB: 1, combinedDistance: 2 },
      });
      const result = await service.calculateRelationship('a', 'b');
      expect(result.found).toBe(true);
      expect(result.relationshipCategory).toBe('unknown');
    });
  });
});
