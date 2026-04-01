import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { Review, RatingSummary } from '../../schemas/Review.graphql';
import { ReviewType } from '../../libs/enums/review.enum';

@Resolver(() => Review)
export class ReviewResolver {
	constructor(private readonly reviewService: ReviewService) {}

	@Query(() => [Review], { name: 'reviews' })
	async getReviewsByTarget(
		@Args('reviewType', { type: () => ReviewType }) reviewType: ReviewType,
		@Args('targetId', { type: () => ID }) targetId: string,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0 }) skip?: number,
	) {
		return this.reviewService.getReviewsByTarget(
			reviewType,
			targetId,
			limit,
			skip,
		);
	}

	@Query(() => [Review], { name: 'ratings' })
	async getRatingsByTarget(
		@Args('reviewType', { type: () => ReviewType }) reviewType: ReviewType,
		@Args('targetId', { type: () => ID }) targetId: string,
		@Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0 }) skip?: number,
	) {
		return this.reviewService.getReviewsByTarget(
			reviewType,
			targetId,
			limit,
			skip,
		);
	}

	@Query(() => Review, { name: 'myReview', nullable: true })
	async getReviewByUser(
		@Args('reviewType', { type: () => ReviewType }) reviewType: ReviewType,
		@Args('targetId', { type: () => ID }) targetId: string,
		@Args('reviewerId', { type: () => ID }) reviewerId: string,
	) {
		return this.reviewService.getReviewByUser(reviewType, targetId, reviewerId);
	}

	@Query(() => RatingSummary, { name: 'ratingSummary' })
	async getAverageRating(
		@Args('reviewType', { type: () => ReviewType }) reviewType: ReviewType,
		@Args('targetId', { type: () => ID }) targetId: string,
	) {
		return this.reviewService.getAverageRating(reviewType, targetId);
	}

	@Mutation(() => Review)
	async createReview(
		@Args('reviewType', { type: () => ReviewType }) reviewType: ReviewType,
		@Args('targetId', { type: () => ID }) targetId: string,
		@Args('reviewerId', { type: () => ID }) reviewerId: string,
		@Args('rating', { type: () => Number }) rating: number,
		@Args('comment', { nullable: true }) comment?: string,
		@Args('images', { type: () => [String], nullable: true }) images?: string[],
	) {
		return this.reviewService.createReview({
			reviewType,
			targetId,
			reviewerId,
			rating,
			comment,
			images,
		});
	}

	@Mutation(() => Review)
	async updateReview(
		@Args('reviewId', { type: () => ID }) reviewId: string,
		@Args('reviewerId', { type: () => ID }) reviewerId: string,
		@Args('rating', { nullable: true, type: () => Number }) rating?: number,
		@Args('comment', { nullable: true }) comment?: string,
		@Args('images', { type: () => [String], nullable: true }) images?: string[],
	) {
		return this.reviewService.updateReview(reviewId, reviewerId, {
			rating,
			comment,
			images,
		});
	}

	@Mutation(() => Boolean)
	async deleteReview(
		@Args('reviewId', { type: () => ID }) reviewId: string,
		@Args('reviewerId', { type: () => ID }) reviewerId: string,
	) {
		return this.reviewService.deleteReview(reviewId, reviewerId);
	}

	@Mutation(() => Review)
	async likeReview(
		@Args('reviewId', { type: () => ID }) reviewId: string,
		@Args('memberId', { type: () => ID }) memberId: string,
	) {
		return this.reviewService.likeReview(reviewId, memberId);
	}
}

