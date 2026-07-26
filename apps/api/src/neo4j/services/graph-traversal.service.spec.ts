import { Test, TestingModule } from '@nestjs/testing';
import { GraphTraversalService } from './graph-traversal.service';
import { Neo4jService } from '../neo4j.service';
import { TreeRepository } from '../repositories/tree.repository';

const mockNeo4jService = {
  isConnected: jest.fn().mockReturnValue(true),
  readQuery: jest.fn().mockResolvedValue({ records: [] }),
  run: jest.fn().mockResolvedValue({ records: [] }),
  writeQuery: jest.fn().mockResolvedValue({ records: [] }),
  getDriver: jest.fn(),
  getSession: jest.fn(),
  close: jest.fn(),
};

const mockTreeRepository = {
  findShortestPath: jest.fn(),
  findCommonAncestors: jest.fn(),
  findNearestCommonAncestor: jest.fn(),
  getAncestors: jest.fn(),
  getDescendants: jest.fn(),
  getFamilyNetwork: jest.fn(),
  getAncestorChain: jest.fn(),
  countGenerations: jest.fn(),
  areConnected: jest.fn(),
};

describe('GraphTraversalService', () => {
  let service: GraphTraversalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphTraversalService,
        { provide: Neo4jService, useValue: mockNeo4jService },
        { provide: TreeRepository, useValue: mockTreeRepository },
      ],
    }).compile();
    service = module.get<GraphTraversalService>(GraphTraversalService);
  });

  describe('getGenerationRelationshipLabel', () => {
    it('should return Parent for generation 1', () => {
      const label = (service as any).getGenerationRelationshipLabel(1);
      expect(label).toBe('Parent');
    });

    it('should return Grandparent for generation 2', () => {
      const label = (service as any).getGenerationRelationshipLabel(2);
      expect(label).toBe('Grandparent');
    });

    it('should return Great Grandparent for generation 3', () => {
      const label = (service as any).getGenerationRelationshipLabel(3);
      expect(label).toBe('Great Grandparent');
    });

    it('should return 2nd Great Grandparent for generation 4', () => {
      const label = (service as any).getGenerationRelationshipLabel(4);
      expect(label).toBe('2nd Great Grandparent');
    });

    it('should return 3rd Great Grandparent for generation 5', () => {
      const label = (service as any).getGenerationRelationshipLabel(5);
      expect(label).toBe('3rd Great Grandparent');
    });

    it('should return 5th Great Grandparent for generation 6', () => {
      const label = (service as any).getGenerationRelationshipLabel(6);
      expect(label).toBe('5th Great Grandparent');
    });

    it('should return 10th Great Grandparent for generation 11', () => {
      const label = (service as any).getGenerationRelationshipLabel(11);
      expect(label).toBe('10th Great Grandparent');
    });

    it('should handle edge case generation 0', () => {
      const label = (service as any).getGenerationRelationshipLabel(0);
      expect(label).toBe('-1th Great Grandparent');
    });
  });
});
