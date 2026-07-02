import { ReplaySubject } from "rxjs";
import { EquipmentResult, ResultMessage, StatusMessage } from "@shared";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AnalysisService {
  private runs = new Map<string, Run>();

  createRun(runId: string) {
    this.runs.set(runId, {
      subject: new ReplaySubject(50),
      clusters: {},
    });
  }

  stream(runId: string) {
    return this.runs.get(runId)!.subject.asObservable();
  }

  applyStatusMessage(message: StatusMessage) {
    const run = this.runs.get(message.runId);

    if (!run) {
      return;
    }

    run.clusters[message.cluster] = {
      ...run.clusters[message.cluster],
      status: message.status,
    };

    run.subject.next({
      type: "status",
      ...message,
    });
  }

  applyResultMessage(message: ResultMessage) {
    const run = this.runs.get(message.runId);

    if (!run) {
      return;
    }

    run.clusters[message.cluster] = {
      ...run.clusters[message.cluster],
      results: message.results,
    };

    run.subject.next({
      type: "result",
      ...message,
    });
  }
}

export type StreamEvent =
  | ({ type: "status" } & StatusMessage)
  | ({ type: "result" } & ResultMessage)
  | { type: "overall"; runId: string; overall: string };

type Run = {
  subject: ReplaySubject<StreamEvent>;
  clusters: Record<string, { status?: string; results?: EquipmentResult[] }>;
};
