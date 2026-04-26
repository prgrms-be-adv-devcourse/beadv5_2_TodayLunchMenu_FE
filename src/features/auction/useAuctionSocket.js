import { useEffect } from "react";
import { Client } from "@stomp/stompjs";

const resolveBrokerUrl = () => {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) {
    return explicit;
  }

  const base = import.meta.env.VITE_SERVER_URL;
  if (base) {
    try {
      const url = new URL(base);
      const scheme = url.protocol === "https:" ? "wss:" : "ws:";
      return `${scheme}//${url.host}/api/auctions/ws`;
    } catch {
      return null;
    }
  }

  // VITE_SERVER_URL 미설정 시 백엔드 직접 연결
  return "ws://3.36.235.7/api/auctions/ws";
};

function useAuctionSocket(auctionId, onBidPlaced, userId, onUserMessage) {
  useEffect(() => {
    if (!auctionId) {
      return undefined;
    }

    const brokerURL = resolveBrokerUrl();
    if (!brokerURL) {
      return undefined;
    }

    const accessToken = localStorage.getItem("accessToken");

    const client = new Client({
      brokerURL,
      connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    let auctionSub = null;
    let userSub = null;

    client.onConnect = () => {
      auctionSub = client.subscribe(`/topic/auctions/${auctionId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          onBidPlaced?.(payload);
        } catch {
          // ignore malformed payloads
        }
      });

      if (userId) {
        userSub = client.subscribe(`/topic/users/${userId}`, (message) => {
          try {
            const parsed = JSON.parse(message.body);
            onUserMessage?.(typeof parsed === "string" ? parsed : message.body);
          } catch {
            onUserMessage?.(message.body);
          }
        });
      }
    };

    client.activate();

    return () => {
      try { auctionSub?.unsubscribe(); } catch { /* noop */ }
      try { userSub?.unsubscribe(); } catch { /* noop */ }
      client.deactivate();
    };
  }, [auctionId, onBidPlaced, userId, onUserMessage]);
}

export { useAuctionSocket };
