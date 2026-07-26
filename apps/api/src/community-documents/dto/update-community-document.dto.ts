import { PartialType } from '@nestjs/swagger';
import { CreateCommunityDocumentDto } from './create-community-document.dto';

export class UpdateCommunityDocumentDto extends PartialType(CreateCommunityDocumentDto) {}
