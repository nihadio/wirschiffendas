import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { FluidsService } from "./FluidsService";
import { AnalyzeRequest } from "@shared/dtos/AnalyzeRequest";

@Controller("fluids")
export class FluidsController {
  constructor(private readonly fluidsService: FluidsService) {}

  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest): Promise<void> {
    return this.fluidsService.run(body);
  }
}
