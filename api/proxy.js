export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path" });

  const targetPath = Array.isArray(path) ? path.join("/") : path;
  const queryString = new URLSearchParams(
    Object.fromEntries(
      Object.entries(req.query).filter(([k]) => k !== "path")
    )
  ).toString();

  const url = `https://api.hostaway.com/${targetPath}${queryString ? "?" + queryString : ""}`;

  let bodyContent = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (typeof req.body === "string") {
      bodyContent = req.body;
    } else if (req.body && typeof req.body === "object") {
      // Si es el request de accessTokens, convertir a URLSearchParams
      if (targetPath.includes("accessTokens")) {
        bodyContent = new URLSearchParams(req.body).toString();
      } else {
        bodyContent = JSON.stringify(req.body);
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/x-www-form-urlencoded",
        ...(req.headers["authorization"] ? { Authorization: req.headers["authorization"] } : {}),
      },
      body: bodyContent,
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
