import { io } from "socket.io-client";
import { getToken, forceLogout } from "./storage_service";

const API_URL = import.meta.env.VITE_API;
let socket = null;

const eventListeners = new Map();

export function SocketConnect() {
  return new Promise((resolve, reject) => {
    if (socket?.connected) return resolve(socket);

    const token = getToken();
    if (!token) return reject("No auth token available");

    socket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id);
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
      if (err.message === "Authentication failed") {
        socket.disconnect();
        socket = null;
        forceLogout();
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket.IO disconnected:", reason);
    });
  });
}

export function SocketDisconnect() {
  return new Promise((resolve) => {
    if (socket) {
      for (const [event, handler] of eventListeners.entries()) {
        socket.off(event, handler);
      }
      eventListeners.clear();
      socket.disconnect();
      socket = null;
    }
    resolve(true);
  });
}

export function SocketSubscribe(event, onMessage) {
  return new Promise((resolve, reject) => {
    if (!socket) return reject("Socket not connected");

    const handler = (payload) => {
      if (typeof onMessage === "function") {
        onMessage(payload);
      }
    };

    socket.on(event, handler);
    eventListeners.set(event, handler);

    const unsubscribe = () => {
      socket?.off(event, handler);
      eventListeners.delete(event);
    };

    resolve(unsubscribe);
  });
}

export function SocketRefreshRooms() {
  if (socket?.connected) {
    socket.emit("refresh-rooms");
  }
}
