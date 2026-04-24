export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL;
  const targetUrl = `${backendUrl}${req.url}`;
  const isSseRequest = req.url?.includes("/api/notifications/stream");
  const controller = new AbortController();

  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(([key]) => key !== 'host')
  );

  const fetchOptions = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    fetchOptions.body = Buffer.concat(chunks);
  }

  req.on("close", () => controller.abort());
  fetchOptions.signal = controller.signal;

  const response = await fetch(targetUrl, fetchOptions);

  response.headers.forEach((value, key) => {
    if (
      key !== "transfer-encoding" &&
      key !== "content-length" &&
      key !== "content-encoding" &&
      key !== "connection"
    ) {
      res.setHeader(key, value);
    }
  });

  if (isSseRequest || response.headers.get("content-type")?.includes("text/event-stream")) {
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
  }

  res.status(response.status);
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  if (isSseRequest || response.headers.get("content-type")?.includes("text/event-stream")) {
    const reader = response.body?.getReader();

    if (!reader) {
      res.end();
      return;
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        if (value) {
          res.write(Buffer.from(value));
        }
      }
    } finally {
      try {
        await reader.cancel();
      } catch {}

      const tail = decoder.decode();
      if (tail) {
        res.write(tail);
      }

      res.end();
    }

    return;
  }

  const buffer = await response.arrayBuffer();
  res.end(Buffer.from(buffer));
}
