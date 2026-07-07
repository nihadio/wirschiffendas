import {
  Box,
  ClickAwayListener,
  Chip,
  CircularProgress,
  Paper,
  Popper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  IconButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useState } from "react";
import { clusters } from "../constants";
import { statusColor } from "../ui";
import type { AnalysisRun, Cluster, ClusterState } from "../types";

type RunsProps = {
  runs: AnalysisRun[];
  busyAction: string;
  onRetry: (runId: string, cluster: Cluster) => void;
};

function shortId(id: string) {
  return id.slice(0, 8);
}

function resultSummary(state: ClusterState) {
  const ok = state.results.filter((item) => item.result === "ok").length;
  const failed = state.results.filter((item) => item.result === "failed").length;

  return { ok, failed };
}

function OverallCell({ run }: { run: AnalysisRun }) {
  if (run.overall === "ok") {
    return <Chip size="small" color="success" label="Success" />;
  }

  if (run.overall === "failed") {
    return <Chip size="small" color="error" label="Failed" />;
  }

  const statuses = Object.values(run.clusterState).map((state) => state.status);

  if (statuses.includes("failed")) {
    return <Chip size="small" color="error" label="Failed" variant="outlined" />;
  }

  return <Chip size="small" color="warning" label="Pending" variant="outlined" />;
}

function ClusterCell({
  run,
  cluster,
  state,
  retrying,
  onRetry,
}: {
  run: AnalysisRun;
  cluster: Cluster;
  state: ClusterState;
  retrying: boolean;
  onRetry: (runId: string, cluster: Cluster) => void;
}) {
  if (retrying) {
    return <Chip size="small" color="warning" label="Retrying" />;
  }

  if (state.status === "running") {
    return <ProgressChip label="Running" />;
  }

  if (state.status === "failed") {
    if (state.reason === "blocked") {
      return (
        <Tooltip title="Never reached: fluids failed, so the chain did not start this service. Retry fluids to re-run everything.">
          <Chip size="small" variant="outlined" label="Blocked" />
        </Tooltip>
      );
    }

    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip size="small" color="error" label="Failed" />
        <IconButton
          size="small"
          onClick={() => onRetry(run.runId, cluster)}
        >
          <RefreshIcon />
        </IconButton>
      </Stack>
    );
  }

  if (state.status === "ready") {
    return <ResultSummaryChip state={state} />;
  }

  return (
    <Typography variant="body2" color="text.secondary">
      Queued
    </Typography>
  );
}

function ProgressChip({ label }: { label: string }) {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{
        bgcolor: "warning.light",
        borderRadius: 4,
        color: "warning.contrastText",
        display: "inline-flex",
        px: 1,
        py: 0.25,
      }}
    >
      <CircularProgress color="inherit" size={12} />
      <Typography variant="caption">{label}</Typography>
    </Stack>
  );
}

function ResultSummaryChip({ state }: { state: ClusterState }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const summary = resultSummary(state);
  const open = Boolean(anchorEl);

  return (
    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
      <Box>
        <Chip
          size="small"
          color={summary.failed > 0 ? "error" : statusColor(state.status)}
          label={
            summary.failed > 0 ? `Ready · ${summary.failed} failed` : "Ready"
          }
          onClick={(event) =>
            setAnchorEl(anchorEl ? null : event.currentTarget)
          }
        />
        <Popper open={open} anchorEl={anchorEl} placement="right-start">
          <Paper elevation={4} sx={{ minWidth: 260, p: 1, ml: 1 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Chip size="small" color="success" label={`${summary.ok} OK`} />
                <Chip
                  size="small"
                  color={summary.failed > 0 ? "error" : "default"}
                  label={`${summary.failed} Failed`}
                />
              </Stack>
              <Stack spacing={0.75}>
                {state.results.map((result) => (
                  <Stack
                    key={result.equipment}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Typography variant="body2">{result.equipment}</Typography>
                    <Chip
                      size="small"
                      color={result.result === "ok" ? "success" : "error"}
                      label={result.result === "ok" ? "OK" : "Failed"}
                    />
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

export function Runs({ runs, busyAction, onRetry }: RunsProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">Runs</Typography>
          <Typography variant="body2" color="text.secondary">
            Parallel analysis runs with per-cluster progress.
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow sx={{ "& th": { whiteSpace: "nowrap" } }}>
                <TableCell>Run ID</TableCell>
                <TableCell>Config ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Started at</TableCell>
                {clusters.map((cluster) => (
                  <TableCell key={cluster.key}>{cluster.label}</TableCell>
                ))}
                <TableCell>Overall</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography color="text.secondary">
                      No analysis runs yet. Start one from the configs table.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow hover key={run.runId}>
                    <TableCell>
                      <Chip size="small" label={shortId(run.runId)} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={shortId(run.configId)} />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5} whiteSpace="nowrap">
                        <Typography variant="body2">
                          {run.config.engineModel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {run.config.cylinderVariant} · {run.config.gearboxType}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(run.startedAt).toLocaleTimeString(undefined, { hour12: false })}
                      </Typography>
                    </TableCell>
                    {clusters.map((cluster) => (
                      <TableCell key={`${run.runId}-${cluster.key}`}>
                        <ClusterCell
                          run={run}
                          cluster={cluster.key}
                          state={run.clusterState[cluster.key]}
                          retrying={
                            busyAction === `retry-${run.runId}-${cluster.key}`
                          }
                          onRetry={onRetry}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <OverallCell run={run} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
}
