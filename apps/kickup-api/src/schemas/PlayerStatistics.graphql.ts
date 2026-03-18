import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class PlayerStatistics {
	@Field(() => ID)
	_id: string;

	@Field(() => ID)
	memberId: string;

	@Field(() => Int)
	totalMatches: number;

	@Field(() => Int)
	matchesWon: number;

	@Field(() => Int)
	matchesDrawn: number;

	@Field(() => Int)
	matchesLost: number;

	@Field(() => Int)
	totalGoals: number;

	@Field(() => Int)
	totalAssists: number;

	@Field(() => Int)
	totalOwnGoals: number;

	@Field(() => Int)
	totalPenalties: number;

	@Field(() => Int)
	matchesAsGK: number;

	@Field(() => Int)
	matchesAsDF: number;

	@Field(() => Int)
	matchesAsMF: number;

	@Field(() => Int)
	matchesAsFW: number;

	@Field(() => Int)
	teamsJoined: number;

	@Field(() => Int)
	currentTeams: number;

	@Field(() => Number)
	averageRating: number;

	@Field(() => Int)
	totalRatings: number;

	@Field(() => Int)
	recentGoals: number;

	@Field(() => Int)
	recentAssists: number;

	@Field(() => Int)
	recentWins: number;

	@Field(() => Int)
	bestGoalsInMatch: number;

	@Field(() => Int)
	bestAssistsInMatch: number;

	@Field({ nullable: true })
	lastMatchDate?: Date;

	@Field({ nullable: true })
	lastGoalDate?: Date;

	@Field(() => Int)
	streakMatches: number;

	@Field(() => Int)
	manOfTheMatch: number;

	@Field(() => Int)
	cleanSheets: number;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}

