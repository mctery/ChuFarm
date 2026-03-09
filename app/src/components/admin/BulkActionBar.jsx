import { Slide, Paper, Stack, Typography, Button } from "@mui/material";

/**
 * Slide-up action bar when items are selected.
 *
 * @param {number} count - number of selected items
 * @param {Array<{ label, icon?, color?, onClick }>} actions - action buttons
 * @param {Function} onClear - clear selection
 */
export default function BulkActionBar({ count = 0, actions = [], onClear }) {
  return (
    <Slide direction="up" in={count > 0} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          px: 3,
          py: 1.5,
          borderRadius: 3,
          zIndex: "modal",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          เลือก {count} รายการ
        </Typography>
        <Stack direction="row" spacing={1}>
          {actions.map((a) => (
            <Button
              key={a.label}
              size="small"
              variant="contained"
              color={a.color || "primary"}
              startIcon={a.icon}
              onClick={a.onClick}
            >
              {a.label}
            </Button>
          ))}
          <Button size="small" variant="outlined" onClick={onClear}>
            ยกเลิก
          </Button>
        </Stack>
      </Paper>
    </Slide>
  );
}
