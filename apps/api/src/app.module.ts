import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FamiliesModule } from './families/families.module';
import { MembersModule } from './members/members.module';
import { RelationshipsModule } from './relationships/relationships.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ProfileModule } from './profile/profile.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UploadModule } from './upload/upload.module';
import { SearchModule } from './search/search.module';
import { MergeModule } from './merge/merge.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityModule } from './activities/activity.module';
import { MemoryModule } from './memories/memory.module';
import { TimelineModule } from './timeline/timeline.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { DuplicatesModule } from './duplicates/duplicates.module';
import { ClanModule } from './clans/clans.module';
import { CommunitiesModule } from './communities/communities.module';
import { SubClansModule } from './subclans/subclans.module';
import { ClanRequestsModule } from './clan-requests/clan-requests.module';
import { ClanHistoryModule } from './clan-history/clan-history.module';
import { EventInvitationsModule } from './event-invitations/event-invitations.module';
import { CommunityHistoryModule } from './community-history/community-history.module';
import { CommunityGalleryModule } from './community-gallery/community-gallery.module';
import { CommunityDirectoryModule } from './community-directory/community-directory.module';
import { CommunityEventsModule } from './community-events/community-events.module';
import { CommunityNewsModule } from './community-news/community-news.module';
import { CommunityDocumentsModule } from './community-documents/community-documents.module';
import { CommunityLocationsModule } from './community-locations/community-locations.module';
import { ClanGalleryModule } from './clan-gallery/clan-gallery.module';
import { ClanDirectoryModule } from './clan-directory/clan-directory.module';
import { ClanEventsModule } from './clan-events/clan-events.module';
import { ClanDocumentsModule } from './clan-documents/clan-documents.module';
import { ClanLocationsModule } from './clan-locations/clan-locations.module';
import { FollowersModule } from './followers/followers.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { ReputationModule } from './reputation/reputation.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { AiInsightsModule } from './ai-insights/ai-insights.module';
import { FeaturedModule } from './featured/featured.module';
import { DocumentVaultModule } from './document-vault/document-vault.module';
import { TreeModule } from './tree/tree.module';
import { GenealogyModule } from './genealogy/genealogy.module';
import { Neo4jModule } from './neo4j/neo4j.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.join(__dirname, '..', '.env'), path.join(__dirname, '..', '..', '.env')],
    }),
    // Rate limiting: 100 requests per 60-second window per IP address.
    // Global ThrottlerGuard applied via APP_GUARD below.
    // Individual routes can override with @SkipThrottle() or @Throttle() decorators.
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 100, // max 100 requests per window
      },
    ]),
    PrismaModule,
    CommonModule,
    CloudinaryModule,
    UploadModule,
    SearchModule,
    MergeModule,
    NotificationsModule,
    ActivityModule,
    MemoryModule,
    TimelineModule,
    DiscoveryModule,
    DuplicatesModule,
    ClanModule,
    CommunitiesModule,
    SubClansModule,
    ClanRequestsModule,
    ClanHistoryModule,
    EventInvitationsModule,
    CommunityHistoryModule,
    CommunityGalleryModule,
    CommunityDirectoryModule,
    CommunityEventsModule,
    CommunityNewsModule,
    CommunityDocumentsModule,
    CommunityLocationsModule,
    ClanGalleryModule,
    ClanDirectoryModule,
    ClanEventsModule,
    ClanDocumentsModule,
    ClanLocationsModule,
    FollowersModule,
    BookmarksModule,
    ReputationModule,
    KnowledgeBaseModule,
    AiInsightsModule,
    FeaturedModule,
    DocumentVaultModule,
    TreeModule,
    GenealogyModule,
    Neo4jModule,
    HealthModule,
    AuthModule,
    UsersModule,
    FamiliesModule,
    MembersModule,
    RelationshipsModule,
    InvitationsModule,
    ProfileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
