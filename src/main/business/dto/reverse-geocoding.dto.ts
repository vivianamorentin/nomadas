import { IsNumber, Min, Max } from 'class-validator';

export class ReverseGeocodingDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
