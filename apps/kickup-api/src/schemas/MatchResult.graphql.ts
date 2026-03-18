import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import { MatchResultStatus } from './MatchResult.model';

@ObjectType()
export class Goal {
	@Field(() => ID)
	playerId: string;

	@Field(() => Int)
	minute: number;

	@Field(() => ID, { nullable: true })
	assistPlayerId?: string;

	@Field(() => Boolean, { nullable: true })
	isOwnGoal?: boolean;

	@Field(() => Boolean, { nullable: true })
	isPenalty?: boolean;
}

@ObjectType()
export class Weather {
	@Field(() => Number, { nullable: true })
	temperature?: number;

	@Field({ nullable: true })
	condition?: string;
}

@ObjectType()
export class MatchResult {
	@Field(() => ID)
	_id: string;

	@Field(() => ID)
	matchId: string;

	@Field(() => ID, { nullable: true })
	homeTeamId?: string;

	@Field(() => ID, { nullable: true })
	awayTeamId?: string;

	@Field(() => Int)
	homeScore: number;

	@Field(() => Int)
	awayScore: number;

	@Field(() => [ID], { nullable: true })
	homePlayers?: string[];

	@Field(() => [ID], { nullable: true })
	awayPlayers?: string[];

	@Field(() => [Goal])
	goals: Goal[];

	@Field(() => MatchResultStatus)
	resultStatus: MatchResultStatus;

	@Field(() => [ID], { nullable: true })
	confirmedBy?: string[];

	@Field(() => ID, { nullable: true })
	disputedBy?: string;

	@Field({ nullable: true })
	disputeReason?: string;

	@Field(() => ID, { nullable: true })
	refereeId?: string;

	@Field({ nullable: true })
	refereeNotes?: string;

	@Field(() => Int, { nullable: true })
	matchDuration?: number;

	@Field(() => Weather, { nullable: true })
	weather?: Weather;

	@Field(() => ID)
	createdBy: string;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

@InputType()
export class CreateMatchResultInput {
	@Field(() => ID)
	matchId: string;

	@Field(() => ID, { nullable: true })
	homeTeamId?: string;

	@Field(() => ID, { nullable: true })
	awayTeamId?: string;

	@Field(() => Int)
	homeScore: number;

	@Field(() => Int)
	awayScore: number;

	@Field(() => [ID], { nullable: true })
	homePlayers?: string[];

	@Field(() => [ID], { nullable: true })
	awayPlayers?: string[];

	@Field(() => [String], { nullable: true })
	goals?: string; // JSON string of goals array

	@Field(() => ID, { nullable: true })
	refereeId?: string;

	@Field({ nullable: true })
	refereeNotes?: string;

	@Field(() => Int, { nullable: true })
	matchDuration?: number;

	@Field(() => Number, { nullable: true })
	temperature?: number;

	@Field({ nullable: true })
	weatherCondition?: string;
}

@InputType()
export class GoalInput {
	@Field(() => ID)
	playerId: string;

	@Field(() => Int)
	minute: number;

	@Field(() => ID, { nullable: true })
	assistPlayerId?: string;

	@Field(() => Boolean, { nullable: true })
	isOwnGoal?: boolean;

	@Field(() => Boolean, { nullable: true })
	isPenalty?: boolean;
}

