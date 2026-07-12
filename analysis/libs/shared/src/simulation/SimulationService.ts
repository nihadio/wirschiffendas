import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { SimulationStatus } from "./SimulationStatus";

@Injectable()
export class SimulationService {
  private status: SimulationStatus = "up";

  markDown() {
    this.status = "down";
  }

  markUp() {
    this.status = "up";
  }

  getStatus() {
    return this.status;
  }

  assertUp() {
    if (this.status === "down") {
      throw new ServiceUnavailableException("Service is simulated down.");
    }
  }
}
