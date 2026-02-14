import { httpRouter } from "convex/server";
import { registerRoutes } from "convex-fs";
import { components } from "./_generated/api";
import { fs } from "./bunnyFs";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Register ConvexFS routes for blob upload/download
registerRoutes(http, components.fs, fs, {
  pathPrefix: "/fs",
  // TODO: Replace with proper authentication before production
  uploadAuth: async () => true, // Allow all uploads for now
  downloadAuth: async () => true, // Allow all downloads for now
});

// Custom download endpoint that sets proper Content-Disposition header
const downloadHandler = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const fileId = url.searchParams.get("id");

  if (!fileId) {
    return new Response("Missing file ID", { status: 400 });
  }

  try {
    // Get file metadata and CDN URL
    const cdnUrl = await ctx.runQuery(api.bunnyStorage.getFile, {
      id: fileId as any,
    });

    if (!cdnUrl) {
      return new Response("File not found", { status: 404 });
    }

    if (!cdnUrl.url) {
      return new Response("File URL not found", { status: 404 });
    }

    // Fetch the file from CDN
    const fileResponse = await fetch(cdnUrl.url);

    if (!fileResponse.ok) {
      return new Response("Failed to fetch file", { status: 500 });
    }

    const blob = await fileResponse.blob();

    // Return with proper Content-Disposition header
    return new Response(blob, {
      headers: {
        "Content-Type": cdnUrl.mimeType,
        "Content-Disposition": `attachment; filename="${cdnUrl.filename}"`,
        "Content-Length": cdnUrl.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

http.route({
  path: "/download",
  method: "GET",
  handler: downloadHandler,
});

export default http;
