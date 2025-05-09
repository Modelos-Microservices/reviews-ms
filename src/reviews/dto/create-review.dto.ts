import { IsString, IsInt, IsNotEmpty, IsOptional, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  product_id: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}