import { useEffect, useRef } from "react";

import { useAuth } from "../auth/useAuth";
import { refreshUnreadCount } from "./useNotification";
import { pushToast } from "./notificationToastStore";
import {
  registerIncomingNotification,
  setConnectionStatus,
} from "./notificationStore";

const SSE_PATH = "/api/notifications/stream";
const RETRY_MIN_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 30000;

const getServerUrl = () => (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");

const buildSseUrl = () => `${getServerUrl()}${SSE_PATH}`;

const normalizeNotification = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return {
    ...payload,
    notificationId: payload.notificationId || payload.id,
  };
};

const parseSseEvent = (rawBlock) => {
  const lines = rawBlock.split("\n");
  let eventName = "message";
  const dataLines = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
    let value = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : "";

    if (value.startsWith(" ")) {
      value = value.slice(1);
    }

    if (field === "event") {
      eventName = value;
    }

    if (field === "data") {
      dataLines.push(value);
    }
  }

  const rawData = dataLines.join("\n");

  if (!rawData) {
    return {
      eventName,
      data: null,
      rawData,
    };
  }

  try {
    return {
      eventName,
      data: JSON.parse(rawData),
      rawData,
    };
  } catch {
    return {
      eventName,
      data: rawData,
      rawData,
    };
  }
};

const readSseStream = async (response, signal, onEvent) => {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("SSE response body is not readable.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    let separatorIndex = buffer.indexOf("\n\n");

    while (separatorIndex >= 0) {
      const rawBlock = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      if (rawBlock.trim()) {
        onEvent(parseSseEvent(rawBlock));
      }

      separatorIndex = buffer.indexOf("\n\n");
    }

    if (signal.aborted) {
      break;
    }
  }

  buffer += decoder.decode().replace(/\r\n/g, "\n");

  if (buffer.trim()) {
    onEvent(parseSseEvent(buffer));
  }
};

function useNotificationSse() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const reconnectTimerRef = useRef(null);
  const controllerRef = useRef(null);
  const retryDelayRef = useRef(RETRY_MIN_DELAY_MS);

  useEffect(() => {
    const isLoggedIn = isAuthenticated && Boolean(user);

    if (authLoading || !isLoggedIn) {
      setConnectionStatus("idle");

      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      retryDelayRef.current = RETRY_MIN_DELAY_MS;
      return;
    }

    let cancelled = false;
    const accessToken = localStorage.getItem("accessToken");

    const connect = async () => {
      if (cancelled) {
        return;
      }

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      setConnectionStatus(
        retryDelayRef.current > RETRY_MIN_DELAY_MS ? "reconnecting" : "connecting"
      );

      try {
        const response = await fetch(buildSseUrl(), {
          method: "GET",
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
          },
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setConnectionStatus("disconnected");
            return;
          }

          throw new Error(`SSE request failed with status ${response.status}.`);
        }

        setConnectionStatus("connected");
        retryDelayRef.current = RETRY_MIN_DELAY_MS;
        refreshUnreadCount().catch(() => {});

        await readSseStream(response, controller.signal, ({ eventName, data }) => {
          if (eventName === "connected") {
            setConnectionStatus("connected");
            return;
          }

          if (eventName !== "notification") {
            return;
          }

          const notification = normalizeNotification(data);

          if (!notification?.notificationId) {
            return;
          }

          registerIncomingNotification(notification);
          pushToast({
            title: notification.title || "새 알림",
            subtitle: notification.subtitle || "",
            message: notification.content || "새 알림이 도착했어요.",
            elapsedTime: notification.elapsedTime || "",
            actions: notification.actions || [],
            notificationId: notification.notificationId || null,
            referenceId: notification.referenceId || null,
            referenceType: notification.referenceType || null,
            notificationType: notification.type || null,
            createdAt: notification.createdAt || null,
            eventId: notification.eventId || null,
            traceId: notification.traceId || null,
            read: notification.read || false,
            tone: notification.type || "info",
          });
        });

        if (!controller.signal.aborted && !cancelled) {
          throw new Error("SSE connection ended.");
        }
      } catch {
        if (cancelled || controller.signal.aborted) {
          return;
        }

        setConnectionStatus("disconnected");

        const nextDelay = Math.min(retryDelayRef.current * 2, RETRY_MAX_DELAY_MS);
        retryDelayRef.current = nextDelay;

        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          connect().catch(() => {});
        }, nextDelay);
      }
    };

    connect().catch(() => {});

    return () => {
      cancelled = true;

      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [authLoading, isAuthenticated, user]);
}

export { useNotificationSse };

