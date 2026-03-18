import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MatchInvitationService } from './match-invitation.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { MatchInvitation, CreateMatchInvitationInput } from '../../schemas/MatchInvitation.graphql';
import { InvitationStatus } from '../../schemas/MatchInvitation.model';
import { MatchInvitation as MatchInvitationModel } from '../../schemas/MatchInvitation.model';

@Resolver(() => MatchInvitation)
export class MatchInvitationResolver {
	constructor(private readonly invitationService: MatchInvitationService) {}

	private convertToGraphQLInvitation(invitation: MatchInvitationModel): MatchInvitation {
		return {
			_id: invitation._id.toString(),
			matchId: invitation.matchId.toString(),
			inviterId: invitation.inviterId.toString(),
			inviteeId: invitation.inviteeId.toString(),
			inviteeType: invitation.inviteeType,
			status: invitation.status as any,
			message: invitation.message,
			respondedAt: invitation.respondedAt,
			createdAt: invitation.createdAt,
			updatedAt: invitation.updatedAt,
		} as MatchInvitation;
	}

	@UseGuards(AuthGuard)
	@Query(() => [MatchInvitation], { name: 'myInvitations' })
	async getMyInvitations(
		@CurrentUser() user: JwtPayload,
		@Args('status', { nullable: true, type: () => InvitationStatus }) status?: InvitationStatus,
	) {
		const invitations = await this.invitationService.getMyInvitations(user.sub, status);
		return invitations.map((i) => this.convertToGraphQLInvitation(i));
	}

	@UseGuards(AuthGuard)
	@Query(() => [MatchInvitation], { name: 'matchInvitations' })
	async getMatchInvitations(@Args('matchId', { type: () => ID }) matchId: string) {
		const invitations = await this.invitationService.getMatchInvitations(matchId);
		return invitations.map((i) => this.convertToGraphQLInvitation(i));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchInvitation)
	async sendMatchInvitation(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreateMatchInvitationInput,
	) {
		const invitation = await this.invitationService.sendInvitation(
			user.sub,
			input.matchId,
			input.inviteeId,
			input.inviteeType as 'MEMBER' | 'TEAM',
			input.message,
		);
		return this.convertToGraphQLInvitation(invitation);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchInvitation)
	async respondToInvitation(
		@CurrentUser() user: JwtPayload,
		@Args('invitationId', { type: () => ID }) invitationId: string,
		@Args('status') status: string, // 'ACCEPTED' | 'REJECTED'
	) {
		const invitation = await this.invitationService.respondToInvitation(
			invitationId,
			user.sub,
			status as 'ACCEPTED' | 'REJECTED',
		);
		return this.convertToGraphQLInvitation(invitation);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MatchInvitation)
	async cancelInvitation(
		@CurrentUser() user: JwtPayload,
		@Args('invitationId', { type: () => ID }) invitationId: string,
	) {
		const invitation = await this.invitationService.cancelInvitation(invitationId, user.sub);
		return this.convertToGraphQLInvitation(invitation);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteInvitation(
		@CurrentUser() user: JwtPayload,
		@Args('invitationId', { type: () => ID }) invitationId: string,
	) {
		return this.invitationService.deleteInvitation(invitationId, user.sub);
	}
}

