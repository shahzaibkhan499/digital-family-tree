import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class FieldPrivacyItem {
  @IsString()
  fieldName: string;

  @IsString()
  visibility: string;
}

export class UpdateFieldPrivacyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldPrivacyItem)
  fields: FieldPrivacyItem[];
}
