import { Module, Global } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { PermissionsService } from './permissions.service';
import { AuthorizationService } from './authorization.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [IdentityService, PermissionsService, AuthorizationService],
  exports: [IdentityService, PermissionsService, AuthorizationService],
})
export class CommonModule {}
