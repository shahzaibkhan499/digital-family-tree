import { PartialType } from '@nestjs/swagger';
import { CreateClanEventDto } from './create-clan-event.dto';

export class UpdateClanEventDto extends PartialType(CreateClanEventDto) {}
