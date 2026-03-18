import { registerEnumType } from '@nestjs/graphql';
import { MediaType } from '../../schemas/MatchMedia.model';

registerEnumType(MediaType, {
	name: 'MediaType',
});

export { MediaType };

