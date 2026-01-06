import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewType } from '../../schemas/Review.model';

@Injectable()
export class ReviewService {
	constructor(
		@InjectModel('Review') private readonly reviewModel: Model<Review>,
	) {}

	async createReview(createReviewDto: {
		reviewType: ReviewType;
		targetId: string;
		reviewerId: string;
		rating: number;
		comment?: string;
		images?: string[];
	}): Promise<Review> {
		// Check if user already reviewed
		const existingReview = await this.reviewModel.findOne({
			reviewType: createReviewDto.reviewType,
			targetId: createReviewDto.targetId,
			reviewerId: createReviewDto.reviewerId,
			deletedAt: null,
		});

		if (existingReview) {
			throw new ConflictException('You have already reviewed this');
		}

		// Set reviewTypeRef based on reviewType
		const reviewTypeRefMap = {
			[ReviewType.FIELD]: 'Property',
			[ReviewType.MATCH]: 'Match',
			[ReviewType.MEMBER]: 'Member',
		};

		const review = new this.reviewModel({
			...createReviewDto,
			reviewTypeRef: reviewTypeRefMap[createReviewDto.reviewType],
		});

		const savedReview = await review.save();

		// Update rating in target (Property/Match)
		await this.updateTargetRating(
			createReviewDto.reviewType,
			createReviewDto.targetId,
		);

		return savedReview;
	}

	async updateReview(
		reviewId: string,
		reviewerId: string,
		updateDto: { rating?: number; comment?: string; images?: string[] },
	): Promise<Review> {
		const review = await this.reviewModel.findOne({
			_id: reviewId,
			reviewerId,
			deletedAt: null,
		});

		if (!review) {
			throw new NotFoundException('Review not found');
		}

		Object.assign(review, updateDto);
		const savedReview = await review.save();

		// Update rating in target
		await this.updateTargetRating(review.reviewType, review.targetId.toString());

		return savedReview;
	}

	async deleteReview(reviewId: string, reviewerId: string): Promise<boolean> {
		const review = await this.reviewModel.findOne({
			_id: reviewId,
			reviewerId,
		});

		if (!review) {
			throw new NotFoundException('Review not found');
		}

		review.deletedAt = new Date();
		await review.save();

		// Update rating in target
		await this.updateTargetRating(review.reviewType, review.targetId.toString());

		return true;
	}

	async getReviewsByTarget(
		reviewType: ReviewType,
		targetId: string,
		limit: number = 20,
		skip: number = 0,
	): Promise<Review[]> {
		return this.reviewModel
			.find({
				reviewType,
				targetId,
				deletedAt: null,
			})
			.populate('reviewerId', 'memberNick memberFullName memberImage')
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.exec();
	}

	async getReviewByUser(
		reviewType: ReviewType,
		targetId: string,
		reviewerId: string,
	): Promise<Review | null> {
		return this.reviewModel
			.findOne({
				reviewType,
				targetId,
				reviewerId,
				deletedAt: null,
			})
			.populate('reviewerId')
			.exec();
	}

	async likeReview(reviewId: string, memberId: string): Promise<Review> {
		const review = await this.reviewModel.findById(reviewId);

		if (!review) {
			throw new NotFoundException('Review not found');
		}

		const memberIdObj = memberId as any;
		if (review.likedBy.some((id) => id.toString() === memberId)) {
			// Unlike
			review.likedBy = review.likedBy.filter(
				(id) => id.toString() !== memberId,
			);
			review.likes = Math.max(0, review.likes - 1);
		} else {
			// Like
			review.likedBy.push(memberIdObj);
			review.likes += 1;
		}

		return review.save();
	}

	private async updateTargetRating(
		reviewType: ReviewType,
		targetId: string,
	): Promise<void> {
		const reviews = await this.reviewModel.find({
			reviewType,
			targetId,
			deletedAt: null,
		});

		if (reviews.length === 0) return;

		const averageRating =
			reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

		if (reviewType === ReviewType.FIELD) {
			const Property = this.reviewModel.db.model('Property');
			await Property.findByIdAndUpdate(targetId, {
				$set: {
					'rating.average': Math.round(averageRating * 10) / 10,
					'rating.count': reviews.length,
				},
			});
		} else if (reviewType === ReviewType.MATCH) {
			// Match uchun ham rating qo'shish mumkin
			// Hozircha Match model'da rating yo'q, lekin keyinroq qo'shish mumkin
		}
	}

	async getAverageRating(
		reviewType: ReviewType,
		targetId: string,
	): Promise<{ average: number; count: number }> {
		const reviews = await this.reviewModel.find({
			reviewType,
			targetId,
			deletedAt: null,
		});

		if (reviews.length === 0) {
			return { average: 0, count: 0 };
		}

		const average =
			reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

		return {
			average: Math.round(average * 10) / 10,
			count: reviews.length,
		};
	}
}

