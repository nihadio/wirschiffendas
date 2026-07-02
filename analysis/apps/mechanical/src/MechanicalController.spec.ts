import { Test, TestingModule } from "@nestjs/testing";
import { MechanicalController } from "./MechanicalController";
import { MechanicalService } from "./MechanicalService";

describe("MechanicalController", () => {
  let mechanicalController: MechanicalController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MechanicalController],
      providers: [MechanicalService],
    }).compile();

    mechanicalController = app.get<MechanicalController>(MechanicalController);
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(mechanicalController.getHello()).toBe("Hello World!");
    });
  });
});
