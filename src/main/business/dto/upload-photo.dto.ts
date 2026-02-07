import { IsString, IsNotEmpty, IsMimeType, MaxLength } from 'class-validator';

export class UploadPhotoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @IsMimeType(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string;
}

export class ConfirmUploadDto {
  @IsString()
  @IsNotEmpty()
  fileKey: string;
}
