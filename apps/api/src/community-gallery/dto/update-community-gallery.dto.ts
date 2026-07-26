import { PartialType } from '@nestjs/swagger';
import { CreateCommunityGalleryDto } from './create-community-gallery.dto';

export class UpdateCommunityGalleryDto extends PartialType(CreateCommunityGalleryDto) {}
