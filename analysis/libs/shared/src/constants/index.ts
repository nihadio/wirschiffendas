import { Cluster } from "../enums";

export const TOPICS = {
  STATUS: "analysis-status",
  RESULT: "analysis-result",
} as const;

export const EQUIPMENT_BY_CLUSTER = {
  [Cluster.FLUIDS]: ["oilSystem", "fuelSystem", "coolingSystem"],
  [Cluster.DRIVETRAIN]: ["powerTransmission", "gearboxOptions"],
  [Cluster.MECHANICAL]: [
    "startingSystem",
    "auxiliaryPto",
    "mountingSystem",
    "exhaustSystem",
  ],
  [Cluster.EMS]: ["engineManagementSystem", "monitoringControlSystem"],
} as const;
