import { Test, TestingModule } from "@nestjs/testing";
import { CoordinatorController } from "./CoordinatorController";
import { CoordinatorService } from "./CoordinatorService";

describe("CoordinatorController", () => {
  let coordinatorController: CoordinatorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CoordinatorController],
      providers: [CoordinatorService],
    }).compile();

    coordinatorController = app.get<CoordinatorController>(
      CoordinatorController,
    );
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(coordinatorController.getHello()).toBe("Hello World!");
    });
  });
});
