import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  private logger = new Logger(ReviewsController.name);

  @MessagePattern({ cmd: 'createReview' })
  create(@Payload() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @MessagePattern({ cmd: 'findAllReviews' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @MessagePattern({ cmd: 'findOneReview' })
  findOne(@Payload() id: string) {
    return this.reviewsService.findOne(id);
  }

  @MessagePattern({ cmd: 'updateReview' })
  update(@Payload() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(updateReviewDto.id, updateReviewDto);
  }

  @MessagePattern({ cmd: 'removeReview' })
  remove(@Payload() id: string) {
    return this.reviewsService.remove(id);
  }
}