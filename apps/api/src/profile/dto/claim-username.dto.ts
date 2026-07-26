import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class ClaimUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username must contain only letters, numbers, hyphens, and underscores',
  })
  username: string;
}
