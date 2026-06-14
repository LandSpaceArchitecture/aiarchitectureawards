import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();
app.use(express.json());

// API routes
import sendEmail from "./api/send-email";
import createCheckoutSession from "./api/create-checkout-session";
import verifySmtp from "./api/verify-smtp";

app.post("/api/send-email", sendEmail);
app.post("/api/create-checkout-session", createCheckoutSession);
app.get("/api/verify-smtp", verifySmtp);

async function startServer() {
  const PORT = 3000;

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
