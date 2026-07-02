import { Injectable } from "@nestjs/common";

@Injectable()
export class EmsService {
  getHello(): string {
    return "Hello World!";
  }
}
