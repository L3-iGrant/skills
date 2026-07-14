// Framework-agnostic core (no React required)
export { createOwsClient, OwsError, type OwsClient, type OwsClientConfig } from "./owsClient";
export { openSseSession, type SseSession, type SseSessionOptions } from "./sseClient";
export * from "./types";

// React layer (optional — requires react as a peer dependency)
export * from "./react";
