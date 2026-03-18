import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import { LeagueStatus, LeagueType } from './League.model';
import { Match } from './Match.graphql';
import { Team } from './Team.graphql';

@ObjectType()
export class LeagueCoordinates {
	@Field(() => Number, { nullable: true })
	lat?: number;

	@Field(() => Number, { nullable: true })
	lng?: number;
}

@ObjectType()
export class LeagueLocation {
	@Field({ nullable: true })
	city?: string;

	@Field({ nullable: true })
	district?: string;

	@Field(() => LeagueCoordinates, { nullable: true })
	coordinates?: LeagueCoordinates;
}

@ObjectType()
export class LeagueTeam {
	@Field(() => ID)
	teamId: string;

	@Field(() => Team, { nullable: true })
	team?: Team;

	@Field(() => Int)
	points: number;

	@Field(() => Int)
	wins: number;

	@Field(() => Int)
	draws: number;

	@Field(() => Int)
	losses: number;

	@Field(() => Int)
	goalsFor: number;

	@Field(() => Int)
	goalsAgainst: number;

	@Field(() => Int)
	goalDifference: number;

	@Field(() => Int)
	matchesPlayed: number;

	@Field()
	joinedAt: Date;
}

@ObjectType()
export class LeagueMatch {
	@Field(() => ID)
	matchId: string;

	@Field(() => Match, { nullable: true })
	match?: Match;

	@Field(() => ID, { nullable: true })
	homeTeamId?: string;

	@Field(() => Team, { nullable: true })
	homeTeam?: Team;

	@Field(() => ID, { nullable: true })
	awayTeamId?: string;

	@Field(() => Team, { nullable: true })
	awayTeam?: Team;

	@Field(() => Int, { nullable: true })
	round?: number;

	@Field()
	status: string;
}

@ObjectType()
export class LeagueContactInfo {
	@Field({ nullable: true })
	phone?: string;

	@Field({ nullable: true })
	email?: string;
}

@ObjectType()
export class League {
	@Field(() => ID)
	_id: string;

	@Field()
	leagueName: string;

	@Field({ nullable: true })
	leagueDescription?: string;

	@Field({ nullable: true })
	leagueLogo?: string;

	@Field({ nullable: true })
	leagueBanner?: string;

	@Field(() => ID)
	organizerId: string;

	@Field(() => LeagueType)
	leagueType: LeagueType;

	@Field(() => LeagueStatus)
	leagueStatus: LeagueStatus;

	@Field(() => [LeagueTeam])
	teams: LeagueTeam[];

	@Field(() => [LeagueMatch])
	matches: LeagueMatch[];

	@Field(() => Int)
	maxTeams: number;

	@Field(() => Int)
	minTeams: number;

	@Field()
	startDate: Date;

	@Field({ nullable: true })
	endDate?: Date;

	@Field()
	registrationDeadline: Date;

	@Field(() => LeagueLocation, { nullable: true })
	location?: LeagueLocation;

	@Field(() => Number, { nullable: true })
	entryFee?: number;

	@Field(() => Number, { nullable: true })
	prizePool?: number;

	@Field({ nullable: true })
	rules?: string;

	@Field(() => LeagueContactInfo, { nullable: true })
	contactInfo?: LeagueContactInfo;

	@Field(() => Int)
	views: number;

	@Field(() => Int)
	followers: number;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class CreateLeagueInput {
	@Field()
	leagueName: string;

	@Field({ nullable: true })
	leagueDescription?: string;

	@Field({ nullable: true })
	leagueLogo?: string;

	@Field({ nullable: true })
	leagueBanner?: string;

	@Field(() => LeagueType)
	leagueType: LeagueType;

	@Field(() => Int)
	maxTeams: number;

	@Field(() => Int)
	minTeams: number;

	@Field()
	startDate: Date;

	@Field({ nullable: true })
	endDate?: Date;

	@Field()
	registrationDeadline: Date;

	@Field({ nullable: true })
	city?: string;

	@Field({ nullable: true })
	district?: string;

	@Field(() => Number, { nullable: true })
	lat?: number;

	@Field(() => Number, { nullable: true })
	lng?: number;

	@Field(() => Number, { nullable: true })
	entryFee?: number;

	@Field(() => Number, { nullable: true })
	prizePool?: number;

	@Field({ nullable: true })
	rules?: string;

	@Field({ nullable: true })
	phone?: string;

	@Field({ nullable: true })
	email?: string;
}

@InputType()
export class UpdateLeagueInput {
	@Field({ nullable: true })
	leagueName?: string;

	@Field({ nullable: true })
	leagueDescription?: string;

	@Field({ nullable: true })
	leagueLogo?: string;

	@Field({ nullable: true })
	leagueBanner?: string;

	@Field(() => LeagueStatus, { nullable: true })
	leagueStatus?: LeagueStatus;

	@Field({ nullable: true })
	endDate?: Date;

	@Field({ nullable: true })
	rules?: string;
}

