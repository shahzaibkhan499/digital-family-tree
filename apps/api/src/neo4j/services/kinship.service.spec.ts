import { Test, TestingModule } from '@nestjs/testing';
import { KinshipService } from './kinship.service';
import { Neo4jService } from '../neo4j.service';
import { GraphTraversalService } from './graph-traversal.service';
import { RelationshipService } from './relationship.service';
import { CousinService } from './cousin.service';
import { AncestorService } from './ancestor.service';
import { PathService } from './path.service';
import { Neo4jQueryCache } from './cache.service';

describe('KinshipService', () => {
  let service: KinshipService;
  let cousinService: CousinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KinshipService,
        { provide: Neo4jService, useValue: { isConnected: () => true } },
        { provide: GraphTraversalService, useValue: {} },
        { provide: RelationshipService, useValue: {} },
        CousinService,
        { provide: AncestorService, useValue: {} },
        { provide: PathService, useValue: {} },
        Neo4jQueryCache,
      ],
    }).compile();
    service = module.get<KinshipService>(KinshipService);
    cousinService = module.get<CousinService>(CousinService);
  });

  describe('calculateConfidenceScore', () => {
    it('Direct parent-child: score 100', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'PARENT',
        pathEdgeTypes: ['PARENT_OF'],
        dA: 0,
        dB: 1,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(100);
    });

    it('Siblings: score 95', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'SIBLING',
        pathEdgeTypes: ['PARENT_OF'],
        dA: 1,
        dB: 1,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(95);
    });

    it('Avuncular: score 90', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'AVUNCULAR',
        pathEdgeTypes: ['PARENT_OF', 'PARENT_OF'],
        dA: 1,
        dB: 2,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(90);
    });

    it('First cousin: score 90', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'COUSIN',
        pathEdgeTypes: ['PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
        dA: 2,
        dB: 2,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(90);
    });

    it('Second cousin: score 80', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'COUSIN',
        pathEdgeTypes: ['PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF', 'PARENT_OF'],
        dA: 3,
        dB: 3,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(80);
    });

    it('Third cousin: score 70', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'COUSIN',
        pathEdgeTypes: [],
        dA: 4,
        dB: 4,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(70);
    });

    it('Fourth cousin: score 60', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'COUSIN',
        pathEdgeTypes: [],
        dA: 5,
        dB: 5,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(60);
    });

    it('Fifth cousin: score 55 (capped at 60 min for blood)', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'COUSIN',
        pathEdgeTypes: [],
        dA: 6,
        dB: 6,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(55);
    });

    it('Path with marriage: -10 per hop', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'COUSIN',
        pathEdgeTypes: ['PARENT_OF', 'MARRIED_TO', 'PARENT_OF'],
        dA: 2,
        dB: 2,
        marriageCount: 1,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(80);
    });

    it('Path with step: -15', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'STEP',
        pathEdgeTypes: ['STEP_PARENT_OF', 'PARENT_OF'],
        dA: 1,
        dB: 2,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: true,
        hasFoster: false,
      });
      expect(score).toBe(75);
    });

    it('Path with adoption: -5', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'ADOPTION',
        pathEdgeTypes: ['ADOPTED_BY', 'PARENT_OF'],
        dA: 1,
        dB: 2,
        marriageCount: 0,
        hasAdoption: true,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(85);
    });

    it('Path with foster: -20', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'FOSTER',
        pathEdgeTypes: ['FOSTER_PARENT_OF'],
        dA: 1,
        dB: 2,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: true,
      });
      expect(score).toBe(70);
    });

    it('Path with guardian: -20', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'LEGAL',
        pathEdgeTypes: ['GUARDIAN_OF'],
        dA: 1,
        dB: 1,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(75);
    });

    it('Multiple marriages: -5 per additional marriage', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'MARRIAGE',
        pathEdgeTypes: ['MARRIED_TO'],
        dA: 0,
        dB: 2,
        marriageCount: 2,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBe(85);
    });

    it('Minimum confidence: 10', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'FOSTER',
        pathEdgeTypes: ['FOSTER_PARENT_OF', 'FOSTER_PARENT_OF', 'FOSTER_PARENT_OF', 'FOSTER_PARENT_OF'],
        dA: 5,
        dB: 5,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: true,
      });
      expect(score).toBeGreaterThanOrEqual(10);
    });

    it('Maximum confidence: 100', () => {
      const score = service.calculateConfidenceScore({
        relationshipType: 'PARENT',
        pathEdgeTypes: [],
        dA: 0,
        dB: 1,
        marriageCount: 0,
        hasAdoption: false,
        hasStep: false,
        hasFoster: false,
      });
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
