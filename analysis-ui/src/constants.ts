import type { Cluster, ClusterState, Equipment, OptionalEquipmentConfig } from "./types";

export const clusters: { key: Cluster; label: string }[] = [
  { key: "fluids", label: "Fluids" },
  { key: "drivetrain", label: "Drivetrain" },
  { key: "mechanical", label: "Mechanical" },
  { key: "ems", label: "EMS" },
];

export const equipmentOptions: { key: Equipment; label: string }[] = [
  { key: "oilSystem", label: "Oil System" },
  { key: "fuelSystem", label: "Fuel System" },
  { key: "coolingSystem", label: "Cooling System" },
  { key: "powerTransmission", label: "Power Transmission" },
  { key: "gearboxOptions", label: "Gearbox Options" },
  { key: "auxiliaryPto", label: "Auxiliary PTO" },
  { key: "startingSystem", label: "Starting System" },
  { key: "mountingSystem", label: "Mounting System" },
  { key: "exhaustSystem", label: "Exhaust System" },
  { key: "engineManagementSystem", label: "Engine Management System" },
  { key: "monitoringControlSystem", label: "Monitoring Control System" },
];

export const emptyClusterState = (): Record<Cluster, ClusterState> => ({
  fluids: { results: [] },
  drivetrain: { results: [] },
  mechanical: { results: [] },
  ems: { results: [] },
});

const initialEquipment = equipmentOptions.reduce(
  (acc, option) => ({
    ...acc,
    [option.key]: true,
  }),
  {} as Record<Equipment, boolean>,
);

export const initialForm: OptionalEquipmentConfig = {
  engineModel: "Diesel Engine 2000 M96",
  cylinderVariant: "12V",
  gearboxType: "ZF 2060",
  equipment: initialEquipment,
};

export function clusterLabel(cluster: Cluster) {
  return clusters.find((item) => item.key === cluster)?.label ?? cluster;
}
