import type { AnalyzeRequest } from "./dtos";

export type AnalyzeAccepted = { accepted: true; runId: string };

/** Choreography step contract. Provided by every algorithm service, required by its caller. */
export interface IAnalyze {
  analyze(request: AnalyzeRequest): Promise<AnalyzeAccepted>;
}

export const FLUIDS_ANALYZE = Symbol("IAnalyze:fluids");
export const DRIVETRAIN_ANALYZE = Symbol("IAnalyze:drivetrain");
export const MECHANICAL_ANALYZE = Symbol("IAnalyze:mechanical");
export const EMS_ANALYZE = Symbol("IAnalyze:ems");
