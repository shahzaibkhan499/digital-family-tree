import { PartialType } from '@nestjs/swagger';
import { CreateCommunityEventDto } from './create-community-event.dto';

export class UpdateCommunityEventDto extends PartialType(CreateCommunityEventDto) {}
