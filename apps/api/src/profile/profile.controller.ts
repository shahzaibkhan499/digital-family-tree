import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateFieldPrivacyDto } from './dto/update-field-privacy.dto';
import { ClaimUsernameDto } from './dto/claim-username.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Patch()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Patch('privacy')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update privacy settings' })
  async updatePrivacy(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePrivacyDto,
  ) {
    return this.profileService.updatePrivacy(userId, dto);
  }

  @Get('completion')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile completion percentage' })
  async getProfileCompletion(@CurrentUser('id') userId: string) {
    return this.profileService.getProfileCompletion(userId);
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get login session history' })
  async getLoginSessions(@CurrentUser('id') userId: string) {
    return this.profileService.getLoginSessions(userId);
  }

  @Post('username')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim username' })
  async claimUsername(
    @CurrentUser('id') userId: string,
    @Body() dto: ClaimUsernameDto,
  ) {
    return this.profileService.claimUsername(userId, dto);
  }

  @Get('settings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get account settings' })
  async getSettings(@CurrentUser('id') userId: string) {
    return this.profileService.getSettings(userId);
  }

  @Patch('settings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update account settings' })
  async updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.profileService.updateSettings(userId, dto);
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get public profile by slug' })
  async getPublicProfile(
    @Param('slug') slug: string,
    @Query('viewerId') viewerId?: string,
  ) {
    return this.profileService.getPublicProfile(slug);
  }

  @Get('public/by-id/:displayId')
  @ApiOperation({ summary: 'Get public profile by display ID' })
  async getPublicProfileByDisplayId(@Param('displayId') displayId: string) {
    return this.profileService.getPublicProfileByDisplayId(displayId);
  }

  @Post('avatar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload avatar' })
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadAvatar(userId, file);
  }

  @Delete('avatar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove avatar' })
  async removeAvatar(@CurrentUser('id') userId: string) {
    return this.profileService.removeAvatar(userId);
  }

  @Post('cover')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload cover photo' })
  async uploadCoverPhoto(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadCoverPhoto(userId, file);
  }

  @Delete('cover')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove cover photo' })
  async removeCoverPhoto(@CurrentUser('id') userId: string) {
    return this.profileService.removeCoverPhoto(userId);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.profileService.deleteAccount(userId);
  }

  @Get('privacy-fields')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get field privacy settings' })
  async getFieldPrivacy(@CurrentUser('id') userId: string) {
    return this.profileService.getFieldPrivacy(userId);
  }

  @Patch('privacy-fields')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update field privacy settings' })
  async updateFieldPrivacy(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateFieldPrivacyDto,
  ) {
    return this.profileService.updateFieldPrivacy(userId, dto);
  }
}
