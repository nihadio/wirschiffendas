import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { clusters } from "../constants";
import type { Cluster } from "../types";

type ManualFailureControlsProps = {
  busyAction: string;
  onSimulate: (cluster: Cluster, state: "down" | "up") => void;
};

export function ManualFailureControls({
  busyAction,
  onSimulate,
}: ManualFailureControlsProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">Manual Failure Controls</Typography>
          <Typography variant="body2" color="text.secondary">
            Use these buttons instead of curl for phase 6 checks.
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {clusters.map((cluster) => (
            <Grid item xs={12} md={6} key={cluster.key}>
              <Card variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Typography variant="subtitle1">{cluster.label}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        color="error"
                        variant="outlined"
                        startIcon={<PowerSettingsNewIcon />}
                        disabled={busyAction === `simulate-${cluster.key}-down`}
                        onClick={() => onSimulate(cluster.key, "down")}
                      >
                        Down
                      </Button>
                      <Button
                        color="success"
                        variant="outlined"
                        startIcon={<PowerSettingsNewIcon />}
                        disabled={busyAction === `simulate-${cluster.key}-up`}
                        onClick={() => onSimulate(cluster.key, "up")}
                      >
                        Up
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
}
