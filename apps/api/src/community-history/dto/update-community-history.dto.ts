import { PartialType } from '@nestjs/swagger';
import { CreateCommunityHistoryDto } from './create-community-history.dto';

export class UpdateCommunityHistoryDto extends PartialType(CreateCommunityHistoryDto) {}
