import { PartialType } from '@nestjs/swagger';
import { CreateCommunityLocationDto } from './create-community-location.dto';

export class UpdateCommunityLocationDto extends PartialType(CreateCommunityLocationDto) {}
