import { Box, Fade, useTheme, alpha } from "@mui/material";
import BoxLoading from "../../../BoxLoading";

export default function SensorFrame({ loading, bgcolor, children }) {
  const theme = useTheme();
  const base  = bgcolor || theme.palette.primary.main;
  const gradient = `linear-gradient(135deg, ${alpha(base, 0.95)} 0%, ${alpha(
    base,
    0.75
  )} 100%)`;

  if (loading) return <BoxLoading variant="widget" />;

  return (
    <Fade in timeout={{ enter: 600, exit: 400 }} mountOnEnter unmountOnExit>
      <Box
        sx={{
          background: gradient,
          color: theme.palette.common.white,
          p: 2,
          borderRadius: 2,
          minHeight: 170,
          height: "100%",
          boxShadow: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {children}
      </Box>
    </Fade>
  );
}
