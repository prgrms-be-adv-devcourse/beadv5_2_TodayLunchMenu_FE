export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL;
  const targetUrl = backendUrl ? `${backendUrl}${req.url}` : null;
  const isSseRequest = req.url?.includes("/api/notifications/stream");

  if (!targetUrl) {
    res.status(500).json({
      error: {
        code: "BACKEND_URL_MISSING",
        message: "BACKEND_URL is not configured.",
      },
    });
    return;
  }

  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(([key]) => key !== "host")
  );

  try {
    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      fetchOptions.body = Buffer.concat(chunks);
    }

    let controller = null;
    if (isSseRequest) {
      controller = new AbortController();
      fetchOptions.signal = controller.signal;
      res.on("close", () => controller.abort());
    }

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
  } catch (error) {
    if (!res.headersSent) {
      res.status(502).json({
        error: {
          code: error?.name === "AbortError" ? "UPSTREAM_ABORTED" : "PROXY_REQUEST_FAILED",
          message:
            error?.name === "AbortError"
              ? "The upstream request was aborted."
              : error?.message || "The proxy request failed.",
        },
      });
      return;
    }

    res.end();
  }
}
