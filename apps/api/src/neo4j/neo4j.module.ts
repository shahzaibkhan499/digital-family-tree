import { Module, Global } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { GraphRepository } from './repositories/graph.repository';
import { PersonRepository } from './repositories/person.repository';
import { FamilyRepository } from './repositories/family.repository';
import { MarriageRepository } from './repositories/marriage.repository';
import { TreeRepository } from './repositories/tree.repository';
import { SyncService } from './services/sync.service';
import { GraphTraversalService } from './services/graph-traversal.service';
import { RelationshipService } from './services/relationship.service';
import { CousinService } from './services/cousin.service';
import { AncestorService } from './services/ancestor.service';
import { PathService } from './services/path.service';
import { Neo4jQueryCache } from './services/cache.service';
import { KinshipService } from './services/kinship.service';

@Global()
@Module({
  providers: [
    Neo4jService,
    GraphRepository,
    PersonRepository,
    FamilyRepository,
    MarriageRepository,
    TreeRepository,
    SyncService,
    GraphTraversalService,
    RelationshipService,
    CousinService,
    AncestorService,
    PathService,
    Neo4jQueryCache,
    KinshipService,
  ],
  exports: [
    Neo4jService,
    GraphRepository,
    PersonRepository,
    FamilyRepository,
    MarriageRepository,
    TreeRepository,
    SyncService,
    GraphTraversalService,
    RelationshipService,
    CousinService,
    AncestorService,
    PathService,
    Neo4jQueryCache,
    KinshipService,
  ],
})
export class Neo4jModule {}
