import type { ChipProps } from "@mui/material";
import type { AlgorithmStatus, AnalysisResult } from "./types";

export function statusColor(status?: AlgorithmStatus): ChipProps["color"] {
  if (status === "ready") {
    return "success";
  }

  if (status === "failed") {
    return "error";
  }

  if (status === "running") {
    return "warning";
  }

  return "default";
}

export function resultColor(result: AnalysisResult): ChipProps["color"] {
  return result === "ok" ? "success" : "error";
}

export function resultLabel(result?: AnalysisResult) {
  if (!result) {
    return "Not Started";
  }

  return result === "ok" ? "OK" : "Failed";
}
