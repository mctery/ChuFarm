import * as React from "react";
import { createContext, useEffect, useMemo, useState, useContext } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getNavigation } from "./pages/_router";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { Outlet } from "react-router";
import { SnackbarProvider } from "notistack";
import { getTheme } from "./theme";

const THEME_KEY = "theme-mode";

export const ThemeContext = createContext({
  mode: "light",
  toggleTheme: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export default function App() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "dark" ? "dark" : "light";
  });
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    const handler = () => setNavKey((k) => k + 1);
    window.addEventListener("menus-updated", handler);
    return () => window.removeEventListener("menus-updated", handler);
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  const themeContextValue = useMemo(() => ({ mode, toggleTheme }), [mode]);
  const navigation = useMemo(() => getNavigation(), [navKey]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <ReactRouterAppProvider
            theme={theme}
            navigation={navigation}
            branding={{
              logo: <img src="./logo.png" alt="logo" />,
              title: "Smart Chu Farm",
              homeUrl: "/dashboard",
              description: "Smart Chu Farm - ระบบจัดการฟาร์มอัจฉริยะ",
            }}
          >
            <Outlet />
          </ReactRouterAppProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
