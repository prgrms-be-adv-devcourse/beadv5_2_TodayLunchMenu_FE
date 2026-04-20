export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL;
  const targetUrl = `${backendUrl}${req.url}`;

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

  const response = await fetch(targetUrl, fetchOptions);

  response.headers.forEach((value, key) => {
    if (key !== 'transfer-encoding') {
      res.setHeader(key, value);
    }
  });

  res.status(response.status);
  const buffer = await response.arrayBuffer();
  res.end(Buffer.from(buffer));
}
