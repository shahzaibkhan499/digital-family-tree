import { PartialType } from '@nestjs/swagger';
import { CreateClanLocationDto } from './create-clan-location.dto';

export class UpdateClanLocationDto extends PartialType(CreateClanLocationDto) {}
