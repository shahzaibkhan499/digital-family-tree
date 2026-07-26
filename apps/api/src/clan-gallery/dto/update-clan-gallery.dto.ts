import { PartialType } from '@nestjs/swagger';
import { CreateClanGalleryDto } from './create-clan-gallery.dto';

export class UpdateClanGalleryDto extends PartialType(CreateClanGalleryDto) {}
