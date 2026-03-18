import { registerEnumType } from '@nestjs/graphql';
import { LeagueStatus, LeagueType } from '../../schemas/League.model';

registerEnumType(LeagueStatus, {
	name: 'LeagueStatus',
});

registerEnumType(LeagueType, {
	name: 'LeagueType',
});

export { LeagueStatus, LeagueType };

