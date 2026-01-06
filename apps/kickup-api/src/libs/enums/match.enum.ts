import { registerEnumType } from '@nestjs/graphql';
import { MatchStatus, MatchType } from '../../schemas/Match.model';

registerEnumType(MatchStatus, {
	name: 'MatchStatus',
});

registerEnumType(MatchType, {
	name: 'MatchType',
});

export { MatchStatus, MatchType };

