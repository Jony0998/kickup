import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RefereeService } from './referee.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { Referee, CreateRefereeInput, UpdateRefereeInput } from '../../schemas/Referee.graphql';
import { RefereeStatus, RefereeLevel } from '../../schemas/Referee.model';
import { Referee as RefereeModel } from '../../schemas/Referee.model';

@Resolver(() => Referee)
export class RefereeResolver {
	constructor(private readonly refereeService: RefereeService) {}

	private convertToGraphQLReferee(referee: RefereeModel): Referee {
		return {
			_id: referee._id.toString(),
			memberId: referee.memberId.toString(),
			refereeLevel: referee.refereeLevel as any,
			refereeStatus: referee.refereeStatus as any,
			certificationNumber: referee.certificationNumber,
			certificationDate: referee.certificationDate,
			experienceYears: referee.experienceYears,
			totalMatches: referee.totalMatches,
			rating: {
				average: referee.rating.average,
				count: referee.rating.count,
			},
			specializations: referee.specializations,
			availability: referee.availability
				? {
						daysOfWeek: referee.availability.daysOfWeek,
						timeSlots: referee.availability.timeSlots,
						city: referee.availability.city,
						district: referee.availability.district,
					}
				: undefined,
			contactInfo: referee.contactInfo
				? {
						phone: referee.contactInfo.phone,
						email: referee.contactInfo.email,
					}
				: undefined,
			notes: referee.notes,
			createdAt: referee.createdAt,
			updatedAt: referee.updatedAt,
		} as Referee;
	}

	@Query(() => [Referee], { name: 'referees' })
	async findAll(
		@Args('status', { nullable: true, type: () => RefereeStatus }) status?: RefereeStatus,
		@Args('level', { nullable: true, type: () => RefereeLevel }) level?: RefereeLevel,
		@Args('city', { nullable: true }) city?: string,
		@Args('limit', { nullable: true, defaultValue: 50, type: () => Int }) limit?: number,
		@Args('skip', { nullable: true, defaultValue: 0, type: () => Int }) skip?: number,
	) {
		const referees = await this.refereeService.findAll({ status, level, city, limit, skip });
		return referees.map((r) => this.convertToGraphQLReferee(r));
	}

	@Query(() => Referee, { name: 'referee' })
	async findOne(@Args('id', { type: () => ID }) id: string) {
		const referee = await this.refereeService.findOne(id);
		return this.convertToGraphQLReferee(referee);
	}

	@Query(() => Referee, { name: 'refereeByMember' })
	async findByMemberId(@Args('memberId', { type: () => ID }) memberId: string) {
		const referee = await this.refereeService.findByMemberId(memberId);
		return this.convertToGraphQLReferee(referee);
	}

	@Query(() => [Referee], { name: 'searchReferees' })
	async searchReferees(
		@Args('searchTerm') searchTerm: string,
		@Args('city', { nullable: true }) city?: string,
		@Args('limit', { nullable: true, defaultValue: 20, type: () => Int }) limit?: number,
	) {
		const referees = await this.refereeService.searchReferees(searchTerm, city, limit);
		return referees.map((r) => this.convertToGraphQLReferee(r));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Referee)
	async createReferee(
		@CurrentUser() user: JwtPayload,
		@Args('input') input: CreateRefereeInput,
	) {
		const referee = await this.refereeService.createReferee(user.sub, input);
		return this.convertToGraphQLReferee(referee);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Referee)
	async updateReferee(
		@CurrentUser() user: JwtPayload,
		@Args('refereeId', { type: () => ID }) refereeId: string,
		@Args('input') input: UpdateRefereeInput,
	) {
		const referee = await this.refereeService.updateReferee(refereeId, user.sub, input);
		return this.convertToGraphQLReferee(referee);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async assignRefereeToMatch(
		@CurrentUser() user: JwtPayload,
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('refereeId', { type: () => ID }) refereeId: string,
	) {
		await this.refereeService.assignToMatch(matchId, refereeId, user.sub);
		return true;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Referee)
	async rateReferee(
		@CurrentUser() user: JwtPayload,
		@Args('refereeId', { type: () => ID }) refereeId: string,
		@Args('matchId', { type: () => ID }) matchId: string,
		@Args('rating', { type: () => Int }) rating: number,
	) {
		const referee = await this.refereeService.rateReferee(refereeId, matchId, rating, user.sub);
		return this.convertToGraphQLReferee(referee);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	async deleteReferee(
		@CurrentUser() user: JwtPayload,
		@Args('refereeId', { type: () => ID }) refereeId: string,
	) {
		return this.refereeService.deleteReferee(refereeId, user.sub);
	}
}

