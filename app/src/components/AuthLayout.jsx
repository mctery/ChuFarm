// AuthLayout — wraps login/register pages with farm background
import { Container, Paper, Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import backgroundImage from "../assets/farm_background.png";

export default function AuthLayout({
  children,
  maxWidth = 400,
  paperSx = {},
  containerProps = {},
  wrapperProps = {},
  paperProps = {},
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { sx: wrapperSx = {}, ...otherWrapper } = wrapperProps;
  const { sx: contSx = {}, ...otherContainer } = containerProps;
  const { sx: pSx = {}, ...otherPaper } = paperProps;

  return (
    <Container
      maxWidth={false}
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          bgcolor: alpha(theme.palette.common.black, isDark ? 0.6 : 0.1),
          transition: "background-color 0.3s",
        },
        ...contSx,
      }}
      {...otherContainer}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          ...(maxWidth ? { maxWidth, width: "100%" } : {}),
          ...wrapperSx,
        }}
        {...otherWrapper}
      >
        <Paper
          elevation={isDark ? 8 : 6}
          sx={{
            p: { xs: "28px", sm: "40px" },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
            backdropFilter: "blur(8px)",
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.9)
              : alpha(theme.palette.background.paper, 0.95),
            ...paperSx,
            ...pSx,
          }}
          {...otherPaper}
        >
          {children}
        </Paper>
      </Box>
    </Container>
  );
}
