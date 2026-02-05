import { IsString, IsNotEmpty } from 'class-validator';

export class ForwardGeocodingDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}
