import { Injectable, ServiceUnavailableException } from "@nestjs/common";

@Injectable()
export class SimulationStateService {
  private down = false;

  markDown() {
    this.down = true;
  }

  markUp() {
    this.down = false;
  }

  assertUp() {
    if (this.down) {
      throw new ServiceUnavailableException("Service is simulated down.");
    }
  }
}
