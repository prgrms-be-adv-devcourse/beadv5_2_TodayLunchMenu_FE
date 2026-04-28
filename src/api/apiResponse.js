const parseResponseBody = async (response) => {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.clone().json();
    }

    const text = await response.clone().text();
    return text || null;
  } catch {
    return null;
  }
};

export { parseResponseBody };
