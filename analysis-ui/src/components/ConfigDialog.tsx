import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { equipmentOptions } from "../constants";
import type {
  CylinderVariant,
  Equipment,
  OptionalEquipmentConfig,
} from "../types";

type ConfigDialogProps = {
  open: boolean;
  form: OptionalEquipmentConfig;
  saving: boolean;
  canSave: boolean;
  selectedEquipmentCount: number;
  onClose: () => void;
  onSave: () => void;
  onFormFieldChange: <K extends keyof OptionalEquipmentConfig>(
    key: K,
    value: OptionalEquipmentConfig[K],
  ) => void;
  onEquipmentChange: (key: Equipment, checked: boolean) => void;
};

export function ConfigDialog({
  open,
  form,
  saving,
  canSave,
  selectedEquipmentCount,
  onClose,
  onSave,
  onFormFieldChange,
  onEquipmentChange,
}: ConfigDialogProps) {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Config</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Selected Equipment: {selectedEquipmentCount}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Engine Model"
                value={form.engineModel}
                onChange={(event) =>
                  onFormFieldChange("engineModel", event.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="cylinder-variant-label">
                  Cylinder Variant
                </InputLabel>
                <Select
                  labelId="cylinder-variant-label"
                  label="Cylinder Variant"
                  value={form.cylinderVariant}
                  onChange={(event) =>
                    onFormFieldChange(
                      "cylinderVariant",
                      event.target.value as CylinderVariant,
                    )
                  }
                >
                  <MenuItem value="10V">10V</MenuItem>
                  <MenuItem value="12V">12V</MenuItem>
                  <MenuItem value="16V">16V</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Gearbox Type"
                value={form.gearboxType}
                onChange={(event) =>
                  onFormFieldChange("gearboxType", event.target.value)
                }
              />
            </Grid>
          </Grid>

          <Grid container spacing={1}>
            {equipmentOptions.map((option) => (
              <Grid item xs={12} sm={6} md={4} key={option.key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.equipment[option.key]}
                      onChange={(event) =>
                        onEquipmentChange(option.key, event.target.checked)
                      }
                    />
                  }
                  label={option.label}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSave}
          disabled={!canSave || saving}
        >
          Create Config
        </Button>
      </DialogActions>
    </Dialog>
  );
}
