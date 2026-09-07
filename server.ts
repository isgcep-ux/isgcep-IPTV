import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route: Fetch external M3U playlist (proxy to bypass browser CORS restrictions)
  app.get("/api/proxy-playlist", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Missing required 'url' query parameter" });
      return;
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 IPTVPlayer/2.0",
          "Accept": "*/*",
        },
      });

      if (!response.ok) {
        res.status(response.status).json({ error: `Failed to fetch playlist: ${response.statusText}` });
        return;
      }

      const content = await response.text();
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(content);
    } catch (err: any) {
      console.error("Playlist proxy error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch playlist" });
    }
  });

  // API Route: Stream Proxy for CORS-restricted live streams, .ts files, .m3u8, and videos
  app.get("/api/proxy-stream", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Missing 'url' parameter" });
      return;
    }

    try {
      const fetchHeaders: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 IPTVPlayer/3.0",
        "Accept": "*/*",
      };

      if (req.headers.range) {
        fetchHeaders["Range"] = req.headers.range;
      }

      const response = await fetch(url, {
        headers: fetchHeaders,
      });

      if (!response.ok && response.status !== 206) {
        res.status(response.status).send(`Stream fetch failed: ${response.statusText}`);
        return;
      }

      // Determine Content-Type
      let contentType = response.headers.get("content-type");
      if (!contentType || contentType === "application/octet-stream" || contentType === "text/plain") {
        if (url.includes(".m3u8")) {
          contentType = "application/vnd.apple.mpegurl";
        } else if (url.includes(".ts")) {
          contentType = "video/mp2t";
        } else if (url.includes(".mp4")) {
          contentType = "video/mp4";
        } else if (url.includes(".webm")) {
          contentType = "video/webm";
        }
      }

      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
      res.setHeader("Accept-Ranges", "bytes");

      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      const contentRange = response.headers.get("content-range");
      if (contentRange) {
        res.setHeader("Content-Range", contentRange);
        res.status(206);
      } else {
        res.status(response.status);
      }

      if (response.body) {
        // @ts-ignore
        const reader = response.body.getReader();
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                res.end();
                break;
              }
              res.write(value);
            }
          } catch {
            res.end();
          }
        };
        pump();
      } else {
        res.end();
      }
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Stream proxy error" });
      }
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IPTV Server running on http://localhost:${PORT}`);
  });
}

startServer();
