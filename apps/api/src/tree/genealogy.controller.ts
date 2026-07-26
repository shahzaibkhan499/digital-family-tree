import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GenealogyCalculatorService } from './genealogy-calculator.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RelationshipService } from '../neo4j/services/relationship.service';
import { GraphTraversalService } from '../neo4j/services/graph-traversal.service';
import { AncestorService } from '../neo4j/services/ancestor.service';
import { CousinService } from '../neo4j/services/cousin.service';
import { PathService } from '../neo4j/services/path.service';
import { KinshipService } from '../neo4j/services/kinship.service';

@ApiTags('Genealogy')
@Controller('genealogy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GenealogyController {
  constructor(
    private readonly genealogyCalculator: GenealogyCalculatorService,
    @Optional() private readonly relationshipService?: RelationshipService,
    @Optional() private readonly graphTraversal?: GraphTraversalService,
    @Optional() private readonly ancestorService?: AncestorService,
    @Optional() private readonly cousinService?: CousinService,
    @Optional() private readonly pathService?: PathService,
    @Optional() private readonly kinshipService?: KinshipService,
  ) {}

  @Get('relationship/:memberIdA/:memberIdB')
  @ApiOperation({ summary: 'Calculate the exact relationship between two family members' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async calculateRelationship(
    @Param('memberIdA') memberIdA: string,
    @Param('memberIdB') memberIdB: string,
    @Query('depth') depth?: number,
  ) {
    return this.genealogyCalculator.calculateRelationship(memberIdA, memberIdB, depth || 20);
  }

  @Get('tree/:familyId')
  @ApiOperation({ summary: 'Get complete genealogy tree for a family' })
  async getGenealogyTree(@Param('familyId') familyId: string) {
    return this.genealogyCalculator.getGenealogyTree(familyId);
  }

  @Get('stats/:familyId')
  @ApiOperation({ summary: 'Get comprehensive genealogy statistics for a family' })
  async getComprehensiveStats(@Param('familyId') familyId: string) {
    return this.genealogyCalculator.getComprehensiveStats(familyId);
  }

  @Post('link-profile')
  @ApiOperation({ summary: 'Link current user profile to a family member' })
  async linkProfileToMember(
    @CurrentUser('id') userId: string,
    @Body('memberId') memberId: string,
  ) {
    await this.genealogyCalculator.linkProfileToMember(userId, memberId);
    return { message: 'Profile linked successfully' };
  }

  @Get('descendants/:memberId')
  @ApiOperation({ summary: 'Get all descendants of a member up to a given depth' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getDescendants(
    @Param('memberId') memberId: string,
    @Query('depth') depth?: number,
  ) {
    return this.genealogyCalculator.getDescendants(memberId, depth || 10);
  }

  @Get('ancestors/:memberId')
  @ApiOperation({ summary: 'Get all ancestors of a member up to a given depth' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getAncestors(
    @Param('memberId') memberId: string,
    @Query('depth') depth?: number,
  ) {
    return this.genealogyCalculator.getAncestors(memberId, depth || 10);
  }

  @Get('calculate/:personIdA/:personIdB')
  @ApiOperation({ summary: 'Calculate exact relationship between two people using Neo4j' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async calculate(
    @Param('personIdA') personIdA: string,
    @Param('personIdB') personIdB: string,
    @Query('depth') depth?: number,
  ) {
    return this.relationshipService?.calculateRelationship(personIdA, personIdB, depth || 20);
  }

  @Get('family-network/:personId')
  @ApiOperation({ summary: 'Get complete family network for a person' })
  async getFamilyNetwork(@Param('personId') personId: string) {
    return this.graphTraversal?.getFamilyNetwork(personId);
  }

  @Get('ancestor-chain/:personId')
  @ApiOperation({ summary: 'Get ancestral chain with relationship labels' })
  @ApiQuery({ name: 'generations', required: false, type: Number })
  async getAncestorChain(
    @Param('personId') personId: string,
    @Query('generations') generations?: number,
  ) {
    return this.ancestorService?.getAncestorChain(personId, generations || 15);
  }

  @Get('generation-diff/:personIdA/:personIdB')
  @ApiOperation({ summary: 'Calculate generation difference between two people' })
  async getGenerationDiff(
    @Param('personIdA') personIdA: string,
    @Param('personIdB') personIdB: string,
  ) {
    return this.ancestorService?.getGenerationDifference(personIdA, personIdB);
  }

  @Get('siblings/:personIdA/:personIdB')
  @ApiOperation({ summary: 'Check if two people are siblings (full, half, or step)' })
  async checkSiblings(
    @Param('personIdA') personIdA: string,
    @Param('personIdB') personIdB: string,
  ) {
    return this.cousinService?.checkSibling(personIdA, personIdB);
  }

  @Get('path/:personIdA/:personIdB')
  @ApiOperation({ summary: 'Get formatted relationship path between two people' })
  async getFormattedPath(
    @Param('personIdA') personIdA: string,
    @Param('personIdB') personIdB: string,
  ) {
    const path = await this.graphTraversal?.findShortestPath(personIdA, personIdB);
    if (!path || !path.found) return { found: false };
    return this.pathService?.formatPath(path.nodeIds, path.relationshipTypes);
  }

  @Get('path-summary/:personIdA/:personIdB')
  @ApiOperation({ summary: 'Get relationship path summary text' })
  async getPathSummary(
    @Param('personIdA') personIdA: string,
    @Param('personIdB') personIdB: string,
  ) {
    const path = await this.graphTraversal?.findShortestPath(personIdA, personIdB);
    if (!path || !path.found) return { found: false, summary: 'No relationship found' };
    return {
      found: true,
      summary: await this.pathService?.generatePathSummary(path.nodeIds, path.relationshipTypes),
      pathAnalysis: this.pathService?.analyzePath(path.relationshipTypes),
    };
  }

  @Get('kinship/:personIdA/:personIdB')
  @ApiOperation({ summary: 'Calculate complete kinship between two people with confidence scoring' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getKinship(
    @Param('personIdA') personIdA: string,
    @Param('personIdB') personIdB: string,
    @Query('depth') depth?: number,
  ) {
    return this.kinshipService?.calculateKinship(personIdA, personIdB, depth || 20);
  }

  @Get('paternal-lineage/:personId')
  @ApiOperation({ summary: 'Get paternal lineage (male ancestors only)' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getPaternalLineage(
    @Param('personId') personId: string,
    @Query('depth') depth?: number,
  ) {
    return this.ancestorService?.getPaternalLineage(personId, depth);
  }

  @Get('maternal-lineage/:personId')
  @ApiOperation({ summary: 'Get maternal lineage (female ancestors only)' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getMaternalLineage(
    @Param('personId') personId: string,
    @Query('depth') depth?: number,
  ) {
    return this.ancestorService?.getMaternalLineage(personId, depth);
  }

  @Get('oldest-ancestor/:personId')
  @ApiOperation({ summary: 'Find the oldest known ancestor of a person' })
  async getOldestAncestor(@Param('personId') personId: string) {
    return this.ancestorService?.getOldestAncestor(personId);
  }

  @Get('family-branches/:ancestorId')
  @ApiOperation({ summary: 'Get family branches stemming from a common ancestor' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getFamilyBranches(
    @Param('ancestorId') ancestorId: string,
    @Query('depth') depth?: number,
  ) {
    return this.graphTraversal?.getFamilyBranches(ancestorId, depth);
  }

  @Get('generation-distribution/:familyId')
  @ApiOperation({ summary: 'Get generation distribution for a family tree' })
  async getGenerationDistribution(@Param('familyId') familyId: string) {
    return this.graphTraversal?.getGenerationDistribution(familyId);
  }

  @Get('ancestors-by-level/:personId/:level')
  @ApiOperation({ summary: 'Get ancestors at a specific generation level' })
  async getAncestorsByLevel(
    @Param('personId') personId: string,
    @Param('level') level: number,
  ) {
    return this.graphTraversal?.getAncestorsByLevel(personId, level);
  }

  @Get('ancestor-count/:personId')
  @ApiOperation({ summary: 'Get ancestor count per generation level' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getAncestorCount(
    @Param('personId') personId: string,
    @Query('depth') depth?: number,
  ) {
    return this.graphTraversal?.getAncestorCountByLevel(personId, depth);
  }
}
