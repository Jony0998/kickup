import { Test, TestingModule } from '@nestjs/testing';
import { KickupBatchController } from './kickup-batch.controller';
import { KickupBatchService } from './kickup-batch.service';

describe('KickupBatchController', () => {
  let kickupBatchController: KickupBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [KickupBatchController],
      providers: [KickupBatchService],
    }).compile();

    kickupBatchController = app.get<KickupBatchController>(KickupBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(kickupBatchController.getHello()).toBe('Hello World!');
    });
  });
});
