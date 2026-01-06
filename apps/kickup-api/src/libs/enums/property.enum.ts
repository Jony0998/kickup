import { registerEnumType } from '@nestjs/graphql';
import { PropertyStatus, PropertyType } from '../../schemas/Property.model';

registerEnumType(PropertyStatus, {
	name: 'PropertyStatus',
});

registerEnumType(PropertyType, {
	name: 'PropertyType',
});

export { PropertyStatus, PropertyType };

