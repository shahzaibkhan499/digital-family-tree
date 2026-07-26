import { PartialType } from '@nestjs/swagger';
import { CreateCommunityNewsDto } from './create-community-news.dto';

export class UpdateCommunityNewsDto extends PartialType(CreateCommunityNewsDto) {}
