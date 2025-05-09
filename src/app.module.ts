import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [ReviewsModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
