import { Test, TestingModule } from "@nestjs/testing";
import { FluidsController } from "./FluidsController";
import { FluidsService } from "./FluidsService";

describe("FluidsController", () => {
  let fluidsController: FluidsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FluidsController],
      providers: [FluidsService],
    }).compile();

    fluidsController = app.get<FluidsController>(FluidsController);
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(fluidsController.getHello()).toBe("Hello World!");
    });
  });
});
