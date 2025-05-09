import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { NatsModule } from 'src/nats/nats.module';
import { PrismaService } from 'src/common/prisma.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, PrismaService],
  imports: [NatsModule],
})
export class ReviewsModule {}
