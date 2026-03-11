import { createTheme, alpha, responsiveFontSizes } from "@mui/material/styles";

export function getTheme(mode) {
  const isLight = mode === "light";

  let theme = createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: {
        main: "#2E7D5F",
        light: "#4CAF80",
        dark: "#1B5E42",
      },
      secondary: {
        main: "#FF8F00",
      },
      success: {
        main: "#43A047",
      },
      background: isLight
        ? { default: "#F5F7F6", paper: "#FFFFFF" }
        : { default: "#0F1210", paper: "#1A1E1B" },
      text: isLight
        ? { primary: "#1A2E23", secondary: "#5F7367" }
        : { primary: "#E8EDE9", secondary: "#A0B0A6" },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: "'Noto Sans Thai', 'Roboto', sans-serif",
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
            color: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 10,
          },
          containedPrimary: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 2px 8px rgba(46,125,95,0.3)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 14,
            boxShadow: isLight
              ? "0 1px 3px rgba(0,0,0,0.05), 0 2px 10px rgba(0,0,0,0.03)"
              : "0 1px 3px rgba(0,0,0,0.2), 0 2px 10px rgba(0,0,0,0.12)",
            border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            "&:hover": {
              boxShadow: isLight
                ? "0 4px 16px rgba(0,0,0,0.07)"
                : "0 4px 16px rgba(0,0,0,0.22)",
            },
            transition: "box-shadow 0.2s ease, transform 0.15s ease",
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: ({ theme }) => ({
            borderColor: alpha(theme.palette.divider, 0.1),
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            padding: "16px",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }),
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiTableCell-head": {
              fontWeight: 600,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }),
        },
      },
      MuiIconButton: {
        defaultProps: {
          disableRipple: false,
        },
      },
      MuiTooltip: {
        defaultProps: {
          arrow: true,
        },
        styleOverrides: {
          tooltip: {
            fontSize: "0.75rem",
            borderRadius: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: ({ theme }) => ({
            "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
              {
                WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
                WebkitTextFillColor: theme.palette.text.primary,
                caretColor: theme.palette.text.primary,
                transition: "background-color 5000s ease-in-out 0s",
              },
          }),
        },
      },
    },
  });

  theme = responsiveFontSizes(theme);
  return theme;
}
