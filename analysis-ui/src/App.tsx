import {
  Alert,
  Box,
  Container,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ConfigDialog } from "./components/ConfigDialog";
import { ManualFailureControls } from "./components/ManualFailureControls";
import { Configs } from "./components/Configs";
import { Runs } from "./components/Runs";
import { useAnalysisDashboard } from "./hooks/useAnalysisDashboard";

function App() {
  const dashboard = useAnalysisDashboard();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Analysis Runs
          </Typography>
          <Typography color="text.secondary">
            Create configs, start analysis runs, and monitor cluster results.
          </Typography>
        </Box>

        {dashboard.error ? (
          <Alert severity="error">{dashboard.error}</Alert>
        ) : null}
        {dashboard.info ? (
          <Alert severity="success">{dashboard.info}</Alert>
        ) : null}

        <Configs
          configs={dashboard.configs}
          loading={dashboard.loadingConfigs}
          startingConfigId={dashboard.startingConfigId}
          activeRunCounts={dashboard.activeRunCounts}
          onCreateClick={dashboard.openConfigDialog}
          onAnalyze={dashboard.startRun}
        />

        <ConfigDialog
          open={dashboard.configDialogOpen}
          form={dashboard.form}
          saving={dashboard.saving}
          canSave={dashboard.canSave}
          selectedEquipmentCount={dashboard.selectedEquipmentCount}
          onClose={dashboard.closeConfigDialog}
          onSave={dashboard.saveConfig}
          onFormFieldChange={dashboard.updateFormField}
          onEquipmentChange={dashboard.updateEquipment}
        />

        {(dashboard.saving || Boolean(dashboard.startingConfigId)) && (
          <LinearProgress />
        )}

        <Runs
          runs={dashboard.runs}
          busyAction={dashboard.busyAction}
          onRetry={dashboard.retry}
        />

        <ManualFailureControls
          busyAction={dashboard.busyAction}
          simulationStatusByCluster={dashboard.simulationStatusByCluster}
          onSimulate={dashboard.simulate}
        />
      </Stack>
    </Container>
  );
}

export default App;
