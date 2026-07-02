import { Injectable } from "@nestjs/common";

@Injectable()
export class MechanicalService {
  getHello(): string {
    return "Hello World!";
  }
}
