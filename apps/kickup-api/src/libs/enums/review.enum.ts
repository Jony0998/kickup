import { registerEnumType } from '@nestjs/graphql';
import { ReviewType } from '../../schemas/Review.model';

registerEnumType(ReviewType, {
	name: 'ReviewType',
});

export { ReviewType };

