import { NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import {
  CONFIG_LOOKUP,
  EVENT_PUBLISHER,
  FLUIDS_ANALYZE,
  SIMULATION_CLIENT,
  type IAnalyze,
  type IConfigLookup,
} from "@shared";
import { AnalysisService } from "../service/AnalysisService";
import { ClusterGateway } from "./ClusterGateway";

function axiosError(status: number) {
  const response = {
    status,
    statusText: "",
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;

  return new AxiosError(
    `Request failed with status code ${status}`,
    undefined,
    undefined,
    undefined,
    response,
  );
}

describe("ClusterGateway", () => {
  let gateway: ClusterGateway;
  let getConfig: jest.Mock;
  let fluidsAnalyze: jest.Mock;

  beforeEach(async () => {
    jest.useFakeTimers();

    getConfig = jest.fn();
    fluidsAnalyze = jest
      .fn()
      .mockResolvedValue({ accepted: true, runId: "run-1" });

    const configLookup: IConfigLookup = { getConfig };
    const fluids: IAnalyze = { analyze: fluidsAnalyze };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ClusterGateway,
        { provide: AnalysisService, useValue: {} },
        { provide: CONFIG_LOOKUP, useValue: configLookup },
        { provide: FLUIDS_ANALYZE, useValue: fluids },
        { provide: SIMULATION_CLIENT, useValue: {} },
        {
          provide: EVENT_PUBLISHER,
          useValue: { emitStatus: jest.fn(), emitRetry: jest.fn() },
        },
      ],
    }).compile();

    gateway = moduleRef.get(ClusterGateway);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("maps a 404 of IConfigLookup to NotFoundException", async () => {
    getConfig.mockRejectedValue(axiosError(404));

    await expect(gateway.assertConfigExists("cfg-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(getConfig).toHaveBeenCalledWith("cfg-1");
  });

  it("maps any other rejection of IConfigLookup to ServiceUnavailableException", async () => {
    getConfig.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(gateway.assertConfigExists("cfg-1")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("starts the anchor through the FLUIDS_ANALYZE binding", async () => {
    gateway.startFluids({ runId: "run-1" });
    await jest.advanceTimersByTimeAsync(0);

    expect(fluidsAnalyze).toHaveBeenCalledTimes(1);
    expect(fluidsAnalyze).toHaveBeenCalledWith({ runId: "run-1" });
  });
});
