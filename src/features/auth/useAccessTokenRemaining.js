import { useEffect, useState } from "react";
import { ACCESS_TOKEN_EXPIRES_AT_KEY } from "./authStore";

function readRemainingMs() {
  const raw = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  const expiresAt = raw ? Number(raw) : 0;

  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    return 0;
  }

  return Math.max(0, expiresAt - Date.now());
}

function formatRemaining(remainingMs) {
  if (!remainingMs || remainingMs <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function useAccessTokenRemaining(enabled = true) {
  const [remainingMs, setRemainingMs] = useState(() =>
    enabled ? readRemainingMs() : 0,
  );

  useEffect(() => {
    if (!enabled) {
      setRemainingMs(0);
      return undefined;
    }

    setRemainingMs(readRemainingMs());

    const timer = window.setInterval(() => {
      setRemainingMs(readRemainingMs());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [enabled]);

  return {
    remainingMs,
    formattedRemaining: formatRemaining(remainingMs),
    isExpiringSoon: remainingMs > 0 && remainingMs <= 5 * 60 * 1000,
  };
}

export { useAccessTokenRemaining };
