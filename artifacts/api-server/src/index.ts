import { setGlobalDispatcher, ProxyAgent } from "undici";
import app from "./app";
import { logger } from "./lib/logger";

// Outbound HTTP(S) must go through the environment proxy when set
// (Node's global fetch does not honor HTTP_PROXY/HTTPS_PROXY by default).
const proxyUrl =
  process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY ?? process.env.PROXY;
if (proxyUrl) {
  try {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    logger.info({ proxy: "enabled" }, "Outbound proxy configured");
  } catch (err: any) {
    logger.warn({ err: String(err?.message ?? err) }, "Proxy agent init failed; continuing direct");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
