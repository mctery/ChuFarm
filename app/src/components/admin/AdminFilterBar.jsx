import { Stack, Select, MenuItem, FormControl, InputLabel } from "@mui/material";

/**
 * Renders a row of Select dropdown filters.
 *
 * @param {Array} filters - [{ label, value, onChange, options: [{ value, label }] }]
 */
export default function AdminFilterBar({ filters = [] }) {
  if (filters.length === 0) return null;

  return (
    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
      {filters.map((filter) => (
        <FormControl key={filter.label} size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{filter.label}</InputLabel>
          <Select
            label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {filter.options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
    </Stack>
  );
}
