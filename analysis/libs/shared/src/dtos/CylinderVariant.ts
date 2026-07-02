export const CYLINDER_VARIANTS = ["10V", "12V", "16V"] as const;

export type CylinderVariant = (typeof CYLINDER_VARIANTS)[number];
