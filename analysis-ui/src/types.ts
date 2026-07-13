export const CLUSTERS = ["fluids", "drivetrain", "mechanical", "ems"] as const;

export type Cluster = (typeof CLUSTERS)[number];

export type AlgorithmStatus = "running" | "ready" | "failed";

export type SimulationStatus = "down" | "up";

export type AnalysisResult = "ok" | "failed";

export type CylinderVariant = "10V" | "12V" | "16V";

export type Equipment =
  | "oilSystem"
  | "fuelSystem"
  | "coolingSystem"
  | "powerTransmission"
  | "gearboxOptions"
  | "auxiliaryPto"
  | "startingSystem"
  | "mountingSystem"
  | "exhaustSystem"
  | "engineManagementSystem"
  | "monitoringControlSystem";

export type OptionalEquipmentConfig = {
  engineModel: string;
  cylinderVariant: CylinderVariant;
  gearboxType: string;
  equipment: Record<Equipment, boolean>;
};

export type ConfigResponse = OptionalEquipmentConfig & {
  id: string;
};

export type EquipmentResult = {
  equipment: Equipment | string;
  result: AnalysisResult;
};

export type StatusEvent = {
  type: "status";
  runId: string;
  cluster: Cluster;
  status: AlgorithmStatus;
};

export type ResultEvent = {
  type: "result";
  runId: string;
  cluster: Cluster;
  results: EquipmentResult[];
};

export type OverallEvent = {
  type: "overall";
  runId: string;
  overall: AnalysisResult;
};

export type StreamEvent = StatusEvent | ResultEvent | OverallEvent;

export type ClusterState = {
  status?: AlgorithmStatus;
  results: EquipmentResult[];
};

export type AnalysisRun = {
  runId: string;
  configId: string;
  config: ConfigResponse;
  clusterState: Record<Cluster, ClusterState>;
  overall?: AnalysisResult;
  startedAt: string;
};
