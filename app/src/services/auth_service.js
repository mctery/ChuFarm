import apiClient from "./apiClient";
import { getToken, forceLogout } from "./storage_service";

export async function SysCheckToken(options = { redirect: true }) {
  const token = getToken();

  if (!token) {
    if (options.redirect) forceLogout();
    return false;
  }

  try {
    const { data } = await apiClient.post("/api/users/token", { token });
    if (data.message === "OK") return true;
    if (options.redirect) forceLogout();
    return false;
  } catch (error) {
    console.error("Token check failed:", error);
    if (options.redirect) forceLogout();
    return false;
  }
}

export function SysSignout() {
  setTimeout(forceLogout, 2000);
}

export async function SysLogin(username, password) {
  try {
    const { data } = await apiClient.post("/api/users/login", {
      email: username,
      password,
    });

    if (data.message === "OK") {
      localStorage.setItem("x-token", data.token);
      if (data.refresh_token) {
        localStorage.setItem("x-refresh-token", data.refresh_token);
      }
      localStorage.setItem("user_info", JSON.stringify(data.data));
      window.dispatchEvent(new Event("menus-updated"));
      return data.data;
    }

    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return false;
    }
    console.error("Login failed:", error);
    throw error;
  }
}

export async function SysForgotPassword(email) {
  try {
    const { data } = await apiClient.post("/api/users/forgot-password", {
      email,
    });

    if (data.message === "OK") {
      return data.data;
    }

    return false;
  } catch (error) {
    console.error("Forgot password failed:", error);
    return false;
  }
}

export async function SysResetPassword(token, password) {
  try {
    const { data } = await apiClient.post("/api/users/reset-password", {
      token,
      password,
    });

    if (data.message === "OK") {
      return data.data;
    }

    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return false;
    }
    console.error("Reset password failed:", error);
    throw error;
  }
}

export async function SysRegister(name, surname, email, password) {
  try {
    const { data } = await apiClient.post("/api/users/register", {
      first_name: name,
      last_name: surname,
      email,
      password,
    });

    if (data.message === "OK") {
      return data.data;
    }

    return false;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      return false;
    }
    console.error("Register failed:", error);
    throw error;
  }
}
