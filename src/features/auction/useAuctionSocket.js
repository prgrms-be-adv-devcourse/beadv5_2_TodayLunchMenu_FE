import { useEffect } from "react";
import { Client } from "@stomp/stompjs";

const resolveBrokerUrl = () => {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) {
    return explicit;
  }

  const base = import.meta.env.VITE_SERVER_URL;
  if (!base) {
    return null;
  }

  try {
    const url = new URL(base);
    const scheme = url.protocol === "https:" ? "wss:" : "ws:";
    return `${scheme}//${url.host}/api/auctions/ws`;
  } catch {
    return null;
  }
};

function useAuctionSocket(auctionId, onBidPlaced) {
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

    let subscription = null;

    client.onConnect = () => {
      subscription = client.subscribe(`/topic/auctions/${auctionId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          onBidPlaced?.(payload);
        } catch {
          // ignore malformed payloads
        }
      });
    };

    client.activate();

    return () => {
      try {
        subscription?.unsubscribe();
      } catch {
        // noop
      }
      client.deactivate();
    };
  }, [auctionId, onBidPlaced]);
}

export { useAuctionSocket };
