import { Cluster } from "./Cluster";

export enum Equipment {
  OIL_SYSTEM = "oilSystem",
  FUEL_SYSTEM = "fuelSystem",
  COOLING_SYSTEM = "coolingSystem",
  POWER_TRANSMISSION = "powerTransmission",
  GEARBOX_OPTIONS = "gearboxOptions",
  AUXILIARY_PTO = "auxiliaryPto",
  STARTING_SYSTEM = "startingSystem",
  MOUNTING_SYSTEM = "mountingSystem",
  EXHAUST_SYSTEM = "exhaustSystem",
  ENGINE_MANAGEMENT_SYSTEM = "engineManagementSystem",
  MONITORING_CONTROL_SYSTEM = "monitoringControlSystem",
}

export const EQUIPMENT_BY_CLUSTER: Record<Cluster, Equipment[]> = {
  [Cluster.FLUIDS]: [
    Equipment.OIL_SYSTEM,
    Equipment.FUEL_SYSTEM,
    Equipment.COOLING_SYSTEM,
  ],
  [Cluster.DRIVETRAIN]: [
    Equipment.POWER_TRANSMISSION,
    Equipment.GEARBOX_OPTIONS,
  ],
  [Cluster.MECHANICAL]: [
    Equipment.STARTING_SYSTEM,
    Equipment.AUXILIARY_PTO,
    Equipment.MOUNTING_SYSTEM,
    Equipment.EXHAUST_SYSTEM,
  ],
  [Cluster.EMS]: [
    Equipment.ENGINE_MANAGEMENT_SYSTEM,
    Equipment.MONITORING_CONTROL_SYSTEM,
  ],
} as const;
