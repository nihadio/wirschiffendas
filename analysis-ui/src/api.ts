import type {
  Cluster,
  ConfigResponse,
  OptionalEquipmentConfig,
  SimulationStatus,
} from "./types";

const CONFIG_API = "http://localhost:3001";
const COORDINATOR_API = "http://localhost:3000";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function listConfigs(): Promise<ConfigResponse[]> {
  return request<ConfigResponse[]>(`${CONFIG_API}/configs`);
}

export function createConfig(
  config: OptionalEquipmentConfig,
): Promise<ConfigResponse> {
  return request<ConfigResponse>(`${CONFIG_API}/configs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });
}

export function startAnalysis(configId: string): Promise<{ runId: string }> {
  return request<{ runId: string }>(`${COORDINATOR_API}/analysis/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ configId }),
  });
}

export function retryCluster(
  runId: string,
  cluster: Cluster,
): Promise<{ accepted: boolean; runId: string; cluster: Cluster }> {
  return request<{ accepted: boolean; runId: string; cluster: Cluster }>(
    `${COORDINATOR_API}/analysis/${runId}/retry/${cluster}`,
    {
      method: "POST",
    },
  );
}

export function fetchSimulationStatuses(): Promise<
  Record<Cluster, SimulationStatus>
> {
  return request<Record<Cluster, SimulationStatus>>(
    `${COORDINATOR_API}/simulation/statuses`,
  );
}

export function simulateCluster(
  cluster: Cluster,
  status: SimulationStatus,
): Promise<{ status: SimulationStatus; cluster: Cluster }> {
  return request<{ status: SimulationStatus; cluster: Cluster }>(
    `${COORDINATOR_API}/simulation/${cluster}/${status}`,
    {
      method: "POST",
    },
  );
}

export function createEventSource(runId: string): EventSource {
  return new EventSource(`${COORDINATOR_API}/analysis/${runId}/stream`);
}
