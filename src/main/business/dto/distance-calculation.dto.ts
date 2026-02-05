import { IsNumber, Min, Max } from 'class-validator';

export class DistanceCalculationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude1: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude1: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude2: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude2: number;
}
