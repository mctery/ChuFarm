// AuthLayout — wraps login/register pages with farm background
import { Container, Paper, Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import backgroundImage from "../assets/farm_background.png";

// Single-column layout (default)
function CenteredLayout({ children, maxWidth, paperSx, containerProps, wrapperProps, paperProps, isDark, theme }) {
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

// Split layout — left panel (brand) + right panel (form)
function SplitLayout({ children, paperSx, isDark, theme, isMobile }) {
  if (isMobile) {
    // On mobile fall back to centered
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
          p: 2,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            bgcolor: alpha(theme.palette.common.black, isDark ? 0.6 : 0.2),
          },
        }}
      >
        <Paper
          elevation={isDark ? 8 : 6}
          sx={{
            position: "relative",
            zIndex: 1,
            p: "28px",
            width: "100%",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
            backdropFilter: "blur(8px)",
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.9)
              : alpha(theme.palette.background.paper, 0.95),
            ...paperSx,
          }}
        >
          {children}
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left: brand panel */}
      <Box
        sx={{
          flex: "0 0 42%",
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 5,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            bgcolor: alpha(theme.palette.primary.dark, isDark ? 0.75 : 0.65),
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", color: "white" }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.common.white, 0.15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              backdropFilter: "blur(4px)",
              border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
            }}
          >
            <AgricultureIcon sx={{ fontSize: 40, color: "white" }} />
          </Box>
          <Typography variant="h3" fontWeight={800} sx={{ color: "white", mb: 1 }}>
            ChuFarm
          </Typography>
          <Typography variant="body1" sx={{ color: alpha(theme.palette.common.white, 0.8), maxWidth: 280 }}>
            ระบบจัดการฟาร์มอัจฉริยะ ติดตามข้อมูลเซ็นเซอร์และควบคุมอุปกรณ์ IoT แบบเรียลไทม์
          </Typography>
        </Box>
      </Box>

      {/* Right: form panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 4,
        }}
      >
        <Paper
          elevation={isDark ? 4 : 2}
          sx={{
            p: "40px",
            width: "100%",
            maxWidth: 440,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
            ...paperSx,
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
}

export default function AuthLayout({
  children,
  layout = "centered",
  maxWidth = 400,
  paperSx = {},
  containerProps = {},
  wrapperProps = {},
  paperProps = {},
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (layout === "split") {
    return (
      <SplitLayout paperSx={paperSx} isDark={isDark} theme={theme} isMobile={isMobile}>
        {children}
      </SplitLayout>
    );
  }

  return (
    <CenteredLayout
      maxWidth={maxWidth}
      paperSx={paperSx}
      containerProps={containerProps}
      wrapperProps={wrapperProps}
      paperProps={paperProps}
      isDark={isDark}
      theme={theme}
    >
      {children}
    </CenteredLayout>
  );
}
