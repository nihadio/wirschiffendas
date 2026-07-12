import { useEffect, useMemo, useRef, useState } from "react";
import {
  createConfig,
  createEventSource,
  fetchSimulationStates,
  listConfigs,
  retryCluster,
  simulateCluster,
  startAnalysis,
} from "../api";
import {
  clusterLabel,
  clusters,
  emptyClusterState,
  initialForm,
} from "../constants";
import type {
  AnalysisRun,
  Cluster,
  ConfigResponse,
  Equipment,
  OptionalEquipmentConfig,
  StreamEvent,
} from "../types";

export function useAnalysisDashboard() {
  const eventSourcesRef = useRef(new Map<string, EventSource>());
  const [form, setForm] = useState<OptionalEquipmentConfig>(initialForm);
  const [configs, setConfigs] = useState<ConfigResponse[]>([]);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [saving, setSaving] = useState(false);
  const [startingConfigId, setStartingConfigId] = useState("");
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [simulationDownByCluster, setSimulationDownByCluster] = useState<
    Record<Cluster, boolean>
  >(() =>
    clusters.reduce(
      (acc, cluster) => ({
        ...acc,
        [cluster.key]: false,
      }),
      {} as Record<Cluster, boolean>,
    ),
  );
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const canSave =
    form.engineModel.trim().length > 0 && form.gearboxType.trim().length > 0;

  const selectedEquipmentCount = useMemo(
    () => Object.values(form.equipment).filter(Boolean).length,
    [form.equipment],
  );

  const activeRunCounts = useMemo(
    () =>
      runs.reduce<Record<string, number>>((acc, run) => {
        acc[run.configId] = (acc[run.configId] ?? 0) + 1;
        return acc;
      }, {}),
    [runs],
  );

  useEffect(() => {
    void loadConfigs();
    void loadSimulationStates();

    return () => {
      eventSourcesRef.current.forEach((eventSource) => eventSource.close());
      eventSourcesRef.current.clear();
    };
  }, []);

  async function loadSimulationStates() {
    try {
      setSimulationDownByCluster(await fetchSimulationStates());
    } catch {
    }
  }

  async function loadConfigs() {
    setLoadingConfigs(true);
    setError("");

    try {
      setConfigs((await listConfigs()).reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load configs");
    } finally {
      setLoadingConfigs(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setError("");
    setInfo("");

    try {
      const config = await createConfig(form);
      setConfigs((current) => [config, ...current]);
      setConfigDialogOpen(false);
      setInfo("Config created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create config");
    } finally {
      setSaving(false);
    }
  }

  async function startRun(configId: string) {
    const config = configs.find((item) => item.id === configId);

    if (!config) {
      setError("Select an existing config before starting analysis");
      return;
    }

    setStartingConfigId(configId);
    setError("");
    setInfo("");

    try {
      const response = await startAnalysis(configId);
      const run: AnalysisRun = {
        runId: response.runId,
        configId,
        config,
        clusterState: emptyClusterState(),
        startedAt: new Date().toISOString(),
      };

      setRuns((current) => [run, ...current]);
      subscribeToRun(response.runId);
      setInfo(`Analysis started for ${config.engineModel}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start analysis");
    } finally {
      setStartingConfigId("");
    }
  }

  async function retry(runId: string, cluster: Cluster) {
    const run = runs.find((item) => item.runId === runId);

    if (!run) {
      setError("Analysis run not found");
      return;
    }

    setBusyAction(`retry-${runId}-${cluster}`);
    setError("");
    setInfo("");
    resetRunCluster(runId, cluster);
    subscribeToRun(runId);

    try {
      await retryCluster(runId, cluster);
      setInfo(`${clusterLabel(cluster)} retry accepted`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not retry ${clusterLabel(cluster)}`,
      );
    } finally {
      setBusyAction("");
    }
  }

  async function simulate(cluster: Cluster, state: "down" | "up") {
    setBusyAction(`simulate-${cluster}-${state}`);
    setError("");
    setInfo("");

    try {
      await simulateCluster(cluster, state);
      setSimulationDownByCluster((current) => ({
        ...current,
        [cluster]: state === "down",
      }));
      setInfo(`${clusterLabel(cluster)} simulated ${state}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not simulate ${clusterLabel(cluster)} ${state}`,
      );
    } finally {
      setBusyAction("");
    }
  }

  function subscribeToRun(runId: string) {
    if (eventSourcesRef.current.has(runId)) {
      return;
    }

    const eventSource = createEventSource(runId);

    eventSource.onmessage = (event) => {
      const streamEvent = JSON.parse(event.data) as StreamEvent;
      applyStreamEvent(streamEvent);

      if (streamEvent.type === "overall") {
        eventSource.close();
        eventSourcesRef.current.delete(runId);
      }
    };

    eventSource.onerror = () => {
      setError(`SSE connection failed or was closed for run ${runId.slice(0, 8)}`);
      eventSource.close();
      eventSourcesRef.current.delete(runId);
    };

    eventSourcesRef.current.set(runId, eventSource);
  }

  function applyStreamEvent(streamEvent: StreamEvent) {
    setRuns((current) =>
      current.map((run) => {
        if (run.runId !== streamEvent.runId) {
          return run;
        }

        if (streamEvent.type === "overall") {
          return {
            ...run,
            overall: streamEvent.overall,
          };
        }

        const currentCluster = run.clusterState[streamEvent.cluster];

        if (streamEvent.type === "status") {
          return {
            ...run,
            clusterState: {
              ...run.clusterState,
              [streamEvent.cluster]: {
                ...currentCluster,
                status: streamEvent.status,
                reason: streamEvent.reason,
              },
            },
          };
        }

        return {
          ...run,
          clusterState: {
            ...run.clusterState,
            [streamEvent.cluster]: {
              ...currentCluster,
              results: streamEvent.results,
            },
          },
        };
      }),
    );
  }

  function resetRunCluster(runId: string, cluster: Cluster) {
    setRuns((current) =>
      current.map((run) => {
        if (run.runId !== runId) {
          return run;
        }

        return {
          ...run,
          overall: undefined,
          clusterState: resetClusterState(run.clusterState, cluster),
        };
      }),
    );
  }

  function resetClusterState(
    current: AnalysisRun["clusterState"],
    cluster: Cluster,
  ): AnalysisRun["clusterState"] {
    if (cluster === "fluids") {
      return {
        ...emptyClusterState(),
        fluids: {
          results: [],
          status: "running",
        },
      };
    }

    if (cluster === "drivetrain" || cluster === "mechanical") {
      return {
        ...current,
        [cluster]: {
          results: [],
          status: "running",
        },
        ems: {
          results: [],
        },
      };
    }

    return {
      ...current,
      ems: {
        results: [],
        status: "running",
      },
    };
  }

  function updateFormField<K extends keyof OptionalEquipmentConfig>(
    key: K,
    value: OptionalEquipmentConfig[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateEquipment(key: Equipment, checked: boolean) {
    setForm((current) => ({
      ...current,
      equipment: {
        ...current.equipment,
        [key]: checked,
      },
    }));
  }

  return {
    form,
    configs,
    runs,
    saving,
    startingConfigId,
    loadingConfigs,
    configDialogOpen,
    simulationDownByCluster,
    busyAction,
    error,
    info,
    canSave,
    selectedEquipmentCount,
    activeRunCounts,
    saveConfig,
    startRun,
    retry,
    simulate,
    updateFormField,
    updateEquipment,
    openConfigDialog: () => setConfigDialogOpen(true),
    closeConfigDialog: () => setConfigDialogOpen(false),
  };
}
