import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewService } from './review.service';
import { ReviewResolver } from './review.resolver';
import ReviewSchema from '../../schemas/Review.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Review', schema: ReviewSchema }]),
	],
	providers: [ReviewService, ReviewResolver],
	exports: [ReviewService],
})
export class ReviewModule {}

