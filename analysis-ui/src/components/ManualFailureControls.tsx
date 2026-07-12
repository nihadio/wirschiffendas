import {
  Box,
  Chip,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { clusters } from "../constants";
import type { Cluster, SimulationStatus } from "../types";

type ManualFailureControlsProps = {
  busyAction: string;
  simulationStatusByCluster: Record<Cluster, SimulationStatus>;
  onSimulate: (cluster: Cluster, status: SimulationStatus) => void;
};

export function ManualFailureControls({
  busyAction,
  simulationStatusByCluster,
  onSimulate,
}: ManualFailureControlsProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6">Manual Failure Controls</Typography>
          <Typography variant="body2" color="text.secondary">
            Toggle a cluster to simulate outage and recovery.
          </Typography>
        </Box>

        <Stack spacing={1}>
          {clusters.map((cluster) => {
            const status = simulationStatusByCluster[cluster.key];
            const isDown = status === "down";
            const disabled =
              busyAction === `simulate-${cluster.key}-down` ||
              busyAction === `simulate-${cluster.key}-up`;

            return (
              <Stack
                key={cluster.key}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{cluster.label}</Typography>
                  <Chip
                    size="small"
                    color={isDown ? "error" : "success"}
                    label={status === "down" ? "Down" : "Up"}
                    variant={isDown ? "filled" : "outlined"}
                  />
                </Stack>
                <Switch
                  checked={!isDown}
                  disabled={disabled}
                  color="success"
                  onChange={(event) =>
                    onSimulate(
                      cluster.key,
                      event.target.checked ? "up" : "down",
                    )
                  }
                />
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}
