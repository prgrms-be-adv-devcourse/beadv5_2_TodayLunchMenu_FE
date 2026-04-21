import { useEffect, useState } from "react";

function useCountdown(endsAt) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) {
      return undefined;
    }

    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, [endsAt]);

  if (!endsAt) {
    return { total: 0, ended: true, h: 0, m: 0, s: 0 };
  }

  const total = Math.max(0, endsAt - now);
  const seconds = Math.floor(total / 1000);

  return {
    total,
    ended: total <= 0,
    h: Math.floor(seconds / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: seconds % 60,
  };
}

export { useCountdown };
