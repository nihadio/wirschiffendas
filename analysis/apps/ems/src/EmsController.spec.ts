import { Test, TestingModule } from "@nestjs/testing";
import { EmsController } from "./EmsController";
import { EmsService } from "./EmsService";

describe("EmsController", () => {
  let emsController: EmsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EmsController],
      providers: [EmsService],
    }).compile();

    emsController = app.get<EmsController>(EmsController);
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(emsController.getHello()).toBe("Hello World!");
    });
  });
});
