import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MatchMediaService } from './match-media.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import {
	MatchMedia,
	CreateMatchMediaInput,
	UpdateMatchMediaInput,
} from '../../schemas/MatchMedia.graphql';
import { MatchMedia as MatchMediaModel } from '../../schemas/MatchMedia.model';

@Resolver(() => MatchMedia)
export class MatchMediaResolver {
	constructor(private readonly matchMediaService: MatchMediaService) {}

	private convertToGraphQLMatchMedia(media: MatchMediaModel): MatchMedia {
		return {
			_id: media._id.toString(),
			matchId: media.matchId.toString(),
			uploadedBy: media.uploadedBy.toString(),
			mediaType: media.mediaType as any,
			mediaUrl: media.mediaUrl,
			thumbnailUrl: media.thumbnailUrl,
			title: media.title,
			description: media.description,
			duration: media.duration,
			fileSize: media.fileSize,
			mimeType: media.mimeType,
			views: media.views,
			likes: media.likes,
			tags: media.tags,
			isPublic: media.isPublic,
			order: media.order,
			createdAt: media.createdAt,
			updatedAt: media.updatedAt,
		} as MatchMedia;
	}

	@Query(() => [MatchMedia], { name: 'matchMedia' })
	async getMatchMedia(
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('userId', { nullable: true, type: () => ID }) userId?: string,
	) {
		const media = await this.matchMediaService.getMatchMedia(matchId, userId);
		return media.map((m) => this.convertToGraphQLMatchMedia(m));
	}

	@Query(() => MatchMedia, { name: 'media' })
	async getMediaById(
		@Args('id', { type: () => ID }) id: string,
		@Args('userId', { nullable: true, type: () => ID }) userId?: string,
	) {
		const media = await this.matchMediaService.getMediaById(id, userId);
		return this.convertToGraphQLMatchMedia(media);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchMedia)
	async uploadMatchMedia(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreateMatchMediaInput,
	) {
		const media = await this.matchMediaService.uploadMedia(user.sub, input);
		return this.convertToGraphQLMatchMedia(media);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchMedia)
	async updateMatchMedia(
		@CurrentUser() user: JwtPayload,
		@Args('mediaId', { type: () => ID }) mediaId: string,
		@Args('input') input: UpdateMatchMediaInput,
	) {
		const media = await this.matchMediaService.updateMedia(mediaId, user.sub, input);
		return this.convertToGraphQLMatchMedia(media);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchMedia)
	async likeMatchMedia(
		@CurrentUser() user: JwtPayload,
		@Args('mediaId', { type: () => ID }) mediaId: string,
	) {
		const media = await this.matchMediaService.likeMedia(mediaId, user.sub);
		return this.convertToGraphQLMatchMedia(media);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteMatchMedia(
		@CurrentUser() user: JwtPayload,
		@Args('mediaId', { type: () => ID }) mediaId: string,
	) {
		return this.matchMediaService.deleteMedia(mediaId, user.sub);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => [MatchMedia])
	async reorderMatchMedia(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('mediaIds', { type: () => [ID] }) mediaIds: string[],
	) {
		const media = await this.matchMediaService.reorderMedia(matchId, mediaIds, user.sub);
		return media.map((m) => this.convertToGraphQLMatchMedia(m));
	}
}

