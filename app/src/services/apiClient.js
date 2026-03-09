import axios from "axios";
import { getToken, getRefreshToken, forceLogout } from "./storage_service";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh state — shared across concurrent requests
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 → attempt token refresh before logging out
    if (error.response?.status === 401 && !originalRequest._retryAuth) {
      const refreshToken = getRefreshToken();

      // No refresh token available — logout immediately
      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retryAuth = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API}/api/users/refresh`,
          { refresh_token: refreshToken }
        );

        if (data.message === "OK" && data.token) {
          localStorage.setItem("x-token", data.token);
          if (data.refresh_token) {
            localStorage.setItem("x-refresh-token", data.refresh_token);
          }

          processQueue(null, data.token);

          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(originalRequest);
        }

        // Refresh response invalid — logout
        processQueue(error);
        forceLogout();
        return Promise.reject(error);
      } catch (refreshError) {
        processQueue(refreshError);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 → insufficient permissions
    if (error.response?.status === 403) {
      console.warn("Permission denied:", error.response.data?.data);
      return Promise.reject(error);
    }

    // 5xx → retry once
    if (error.response?.status >= 500 && !originalRequest._retried) {
      originalRequest._retried = true;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

/**
 * Wrapper for API calls — eliminates duplicate try/catch in every service function.
 * @param {Function} requestFn  — receives apiClient, returns axios response
 * @param {*} fallback          — value returned on error (default: null)
 * @param {string} label        — label for console.error
 */
export async function makeRequest(requestFn, { fallback = null, label = "API request" } = {}) {
  try {
    const { data } = await requestFn(apiClient);
    if (data.message === "OK") return data;
    return { ...data, _ok: false };
  } catch (error) {
    console.error(`${label} failed:`, error);
    return { _ok: false, _fallback: true, data: fallback };
  }
}

export default apiClient;
