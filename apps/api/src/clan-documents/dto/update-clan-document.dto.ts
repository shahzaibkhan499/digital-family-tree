import { PartialType } from '@nestjs/swagger';
import { CreateClanDocumentDto } from './create-clan-document.dto';

export class UpdateClanDocumentDto extends PartialType(CreateClanDocumentDto) {}
