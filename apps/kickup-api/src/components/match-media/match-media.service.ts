import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchMedia, MediaType } from '../../schemas/MatchMedia.model';
import { Match } from '../../schemas/Match.model';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class MatchMediaService {
	constructor(
		@InjectModel('MatchMedia') private readonly matchMediaModel: Model<MatchMedia>,
		@InjectModel('Match') private readonly matchModel: Model<Match>,
	) {}

	async uploadMedia(
		uploadedBy: string,
		createMediaDto: any,
	): Promise<MatchMedia> {
		// Check if match exists
		const match = await this.matchModel.findById(createMediaDto.matchId);
		if (!match || match.deletedAt) {
			throw new NotFoundException('Match not found');
		}

		// Check if user was part of the match
		const wasInMatch =
			match.organizerId.toString() === uploadedBy ||
			match.joinedPlayers.some((id) => id.toString() === uploadedBy);

		if (!wasInMatch) {
			throw new ForbiddenException('Only match participants can upload media');
		}

		// Get max order for this match
		const maxOrder = await this.matchMediaModel
			.findOne({ matchId: createMediaDto.matchId, deletedAt: null })
			.sort({ order: -1 })
			.select('order')
			.exec();

		const order = maxOrder ? maxOrder.order + 1 : 0;

		// Create media
		const media = new this.matchMediaModel({
			...createMediaDto,
			uploadedBy,
			order,
		});

		return media.save();
	}

	async getMatchMedia(matchId: string, userId?: string): Promise<MatchMedia[]> {
		const query: any = { matchId, deletedAt: null };

		// If user is not provided or not part of match, only show public media
		if (userId) {
			const match = await this.matchModel.findById(matchId);
			if (match) {
				const wasInMatch =
					match.organizerId.toString() === userId ||
					match.joinedPlayers.some((id) => id.toString() === userId);

				if (!wasInMatch) {
					query.isPublic = true;
				}
			} else {
				query.isPublic = true;
			}
		} else {
			query.isPublic = true;
		}

		return this.matchMediaModel
			.find(query)
			.populate('uploadedBy', 'memberNick memberFullName memberImage')
			.sort({ order: 1, createdAt: -1 })
			.exec();
	}

	async getMediaById(mediaId: string, userId?: string): Promise<MatchMedia> {
		const media = await this.matchMediaModel
			.findById(mediaId)
			.populate('uploadedBy', 'memberNick memberFullName memberImage')
			.populate('matchId', 'matchTitle matchDate')
			.exec();

		if (!media || media.deletedAt) {
			throw new NotFoundException('Media not found');
		}

		// Check access
		if (!media.isPublic && userId) {
			const match = await this.matchModel.findById(media.matchId);
			if (match) {
				const wasInMatch =
					match.organizerId.toString() === userId ||
					match.joinedPlayers.some((id) => id.toString() === userId);

				if (!wasInMatch && media.uploadedBy.toString() !== userId) {
					throw new ForbiddenException('Access denied');
				}
			}
		}

		// Increment views
		media.views += 1;
		await media.save();

		return media;
	}

	async updateMedia(
		mediaId: string,
		userId: string,
		updateData: any,
	): Promise<MatchMedia> {
		const media = await this.matchMediaModel.findById(mediaId);

		if (!media || media.deletedAt) {
			throw new NotFoundException('Media not found');
		}

		// Only uploader can update
		if (media.uploadedBy.toString() !== userId) {
			throw new ForbiddenException('Only uploader can update media');
		}

		Object.assign(media, updateData);
		return media.save();
	}

	async likeMedia(mediaId: string, userId: string): Promise<MatchMedia> {
		const media = await this.matchMediaModel.findById(mediaId);

		if (!media || media.deletedAt) {
			throw new NotFoundException('Media not found');
		}

		// Check if already liked
		const alreadyLiked = media.likedBy.some((id) => id.toString() === userId);

		if (alreadyLiked) {
			// Unlike
			media.likedBy = media.likedBy.filter((id) => id.toString() !== userId);
			media.likes -= 1;
		} else {
			// Like
			media.likedBy.push(userId as any);
			media.likes += 1;
		}

		return media.save();
	}

	async deleteMedia(mediaId: string, userId: string): Promise<boolean> {
		const media = await this.matchMediaModel.findById(mediaId);

		if (!media || media.deletedAt) {
			throw new NotFoundException('Media not found');
		}

		// Only uploader can delete
		if (media.uploadedBy.toString() !== userId) {
			throw new ForbiddenException('Only uploader can delete media');
		}

		media.deletedAt = new Date();
		await media.save();

		return true;
	}

	async reorderMedia(
		matchId: string,
		mediaIds: string[],
		userId: string,
	): Promise<MatchMedia[]> {
		// Check if user is match organizer
		const match = await this.matchModel.findById(matchId);
		if (!match || match.deletedAt) {
			throw new NotFoundException('Match not found');
		}

		if (match.organizerId.toString() !== userId) {
			throw new ForbiddenException('Only match organizer can reorder media');
		}

		// Update order for each media
		const updatePromises = mediaIds.map((mediaId, index) =>
			this.matchMediaModel.updateOne(
				{ _id: mediaId, matchId, deletedAt: null },
				{ $set: { order: index } },
			),
		);

		await Promise.all(updatePromises);

		return this.getMatchMedia(matchId, userId);
	}
}

