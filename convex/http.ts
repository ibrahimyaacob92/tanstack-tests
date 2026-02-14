import { httpRouter } from "convex/server";
import { registerRoutes } from "convex-fs";
import { components } from "./_generated/api";
import { fs } from "./bunnyFs";

const http = httpRouter();

// Register ConvexFS routes for blob upload/download
registerRoutes(http, components.fs, fs, {
  pathPrefix: "/fs",
  // TODO: Replace with proper authentication before production
  uploadAuth: async () => true, // Allow all uploads for now
  downloadAuth: async () => true, // Allow all downloads for now
});

export default http;
