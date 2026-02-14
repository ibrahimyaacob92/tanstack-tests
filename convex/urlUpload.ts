import { action } from "./_generated/server";
import { v } from "convex/values";
import { r2 } from "./files";
import { api } from "./_generated/api";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Action to upload a file from URL to R2
export const uploadFromUrl = action({
  args: {
    url: v.string(),
    filename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch the file from URL
      const response = await fetch(args.url);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      // Get file info from response headers
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      const contentLength = response.headers.get("content-length");
      const fileSize = contentLength ? parseInt(contentLength) : 0;

      // Determine filename
      let filename = args.filename;
      if (!filename) {
        // Try to extract from URL
        const urlPath = new URL(args.url).pathname;
        filename = urlPath.split("/").pop() || "downloaded-file";
      }

      // Generate unique storage key
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const storageKey = `url-uploads/${timestamp}-${random}-${filename}`;

      // Get file content as blob
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      // Upload to R2 using S3 PutObjectCommand
      const putCommand = new PutObjectCommand({
        Bucket: r2.config.bucket,
        Key: storageKey,
        Body: new Uint8Array(buffer),
        ContentType: contentType,
      });

      await r2.client.send(putCommand);

      // Save metadata to database
      await ctx.runMutation(api.files.saveFileMetadata, {
        storageKey,
        filename: filename,
        originalFilename: filename,
        fileSize: fileSize,
        mimeType: contentType,
      });

      return {
        success: true,
        storageKey,
        filename,
        fileSize,
        mimeType: contentType,
      };
    } catch (error) {
      console.error("URL upload error:", error);
      throw new Error(
        `Failed to upload from URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
});
