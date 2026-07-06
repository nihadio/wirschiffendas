import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { ConfigResponse } from "../types";

type ConfigTableProps = {
  configs: ConfigResponse[];
  loading: boolean;
  startingConfigId: string;
  activeRunCounts: Record<string, number>;
  onCreateClick: () => void;
  onAnalyze: (configId: string) => void;
};

function selectedEquipmentCount(config: ConfigResponse) {
  return Object.values(config.equipment ?? {}).filter(Boolean).length;
}

function shortId(id: string) {
  return id.slice(0, 8);
}

export function ConfigTable({
  configs,
  loading,
  startingConfigId,
  activeRunCounts,
  onCreateClick,
  onAnalyze,
}: ConfigTableProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h6">Configs</Typography>
            <Typography variant="body2" color="text.secondary">
              Select a saved config and start an analysis run.
            </Typography>
          </Box>
          <Button variant="text" startIcon={<AddIcon />} onClick={onCreateClick} size="small">
            Create Config
          </Button>
        </Stack>

        {loading ? <LinearProgress /> : null}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Engine Model</TableCell>
                <TableCell>Cylinders</TableCell>
                <TableCell>Gearbox</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Config ID</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">
                      No configs found. Create one to start an analysis.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow hover key={config.id}>
                    <TableCell>{config.engineModel}</TableCell>
                    <TableCell>{config.cylinderVariant}</TableCell>
                    <TableCell>{config.gearboxType}</TableCell>
                    <TableCell>{selectedEquipmentCount(config)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={shortId(config.id)} />
                        {activeRunCounts[config.id] ? (
                          <Chip
                            size="small"
                            color="primary"
                            label={`${activeRunCounts[config.id]} Run${activeRunCounts[config.id] === 1 ? "" : "s"
                              }`}
                          />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlayArrowIcon />}
                        disabled={startingConfigId === config.id}
                        onClick={() => onAnalyze(config.id)}
                      >
                        Analyze
                      </Button>
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
