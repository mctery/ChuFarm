import { CircularProgress, Typography, Stack } from '@mui/material';

/**
 * Unified loading component.
 * @param {"page" | "widget"} variant — "page" for full-page spinner, "widget" for inline widget loader
 */
const BoxLoading = ({ variant = "page" }) => {
  if (variant === "widget") {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{
          height: '100%',
          width: '100%',
          borderRadius: 1,
          bgcolor: 'background.paper',
          px: 2,
        }}
      >
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          กำลังโหลดข้อมูล...
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ minHeight: "100vh" }}
    >
      <CircularProgress />
      <Typography color="text.secondary">กำลังโหลดข้อมูล...</Typography>
    </Stack>
  );
};

export default BoxLoading;
