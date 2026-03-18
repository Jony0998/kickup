import { registerEnumType } from '@nestjs/graphql';
import { PaymentStatus, PaymentType, PaymentMethod } from '../../schemas/Payment.model';

registerEnumType(PaymentStatus, {
	name: 'PaymentStatus',
});

registerEnumType(PaymentType, {
	name: 'PaymentType',
});

registerEnumType(PaymentMethod, {
	name: 'PaymentMethod',
});

export { PaymentStatus, PaymentType, PaymentMethod };

