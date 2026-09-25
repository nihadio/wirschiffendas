import type { OptionalEquipmentConfig } from "./dtos";

export type ConfigView = OptionalEquipmentConfig & { id: string };

/** Provided by the Config-Service, required by the UI (CRUD) and the coordinator (lookup). */
export interface IConfig {
  getConfigs(): Promise<ConfigView[]>;
  /** Rejects with 404 on an unknown id. */
  getConfig(id: string): Promise<ConfigView>;
  createConfig(config: OptionalEquipmentConfig): Promise<ConfigView>;
  updateConfig(
    id: string,
    config: Partial<OptionalEquipmentConfig>,
  ): Promise<ConfigView>;
}

/** Required subset used by the coordinator (interface segregation). */
export type IConfigLookup = Pick<IConfig, "getConfig">;

export const CONFIG_LOOKUP = Symbol("IConfigLookup");
