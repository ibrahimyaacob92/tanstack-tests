import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { fs } from "./bunnyFs";
import { api } from "./_generated/api";
import { buildDownloadUrl } from "convex-fs";

// Commit uploaded file to ConvexFS
export const commitFile = action({
  args: {
    blobId: v.string(),
    filename: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    // Create path with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const path = `/${timestamp}-${args.filename}`;

    // Commit the blob to ConvexFS
    await fs.commitFiles(ctx, [
      {
        path,
        blobId: args.blobId,
      },
    ]);

    // Save metadata to database
    await ctx.runMutation(api.bunnyStorage.saveFileMetadata, {
      path,
      blobId: args.blobId,
      filename: args.filename,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
    });

    return { success: true, path };
  },
});

// Save file metadata to database
export const saveFileMetadata = mutation({
  args: {
    path: v.string(),
    blobId: v.string(),
    filename: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("bunnyFiles", {
      path: args.path,
      blobId: args.blobId,
      filename: args.filename,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      uploadedAt: Date.now(),
      description: args.description,
    });
    return fileId;
  },
});

// List all files with download URLs
export const listFiles = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("bunnyFiles").order("desc").collect();

    // Build download URLs for all files
    const siteUrl = process.env.CONVEX_SITE_URL!;
    const filesWithUrls = files.map((file) => ({
      ...file,
      url: buildDownloadUrl(siteUrl, "/fs", file.blobId, file.path),
    }));

    return filesWithUrls;
  },
});

// Get a single file by ID with download URL
export const getFile = query({
  args: { id: v.id("bunnyFiles") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) {
      return null;
    }

    // Build download URL
    const siteUrl = process.env.CONVEX_SITE_URL!;
    const url = buildDownloadUrl(siteUrl, "/fs", file.blobId, file.path);

    return {
      ...file,
      url,
    };
  },
});

// Delete a file from both ConvexFS and database
export const deleteFile = action({
  args: { id: v.id("bunnyFiles") },
  handler: async (ctx, args) => {
    // Get file metadata from database
    const file = await ctx.runQuery(api.bunnyStorage.getFileForDeletion, {
      id: args.id,
    });

    if (!file) {
      throw new Error("File not found");
    }

    // Delete from ConvexFS using transact
    await fs.transact(ctx, [
      {
        op: "delete",
        source: {
          path: file.path,
          blobId: file.blobId,
          contentType: file.mimeType,
          size: file.fileSize,
        },
      },
    ]);

    // Delete from database
    await ctx.runMutation(api.bunnyStorage.deleteFileMetadata, {
      id: args.id,
    });

    return { success: true };
  },
});

// Helper query to get file for deletion
export const getFileForDeletion = query({
  args: { id: v.id("bunnyFiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Helper mutation to delete file metadata
export const deleteFileMetadata = mutation({
  args: { id: v.id("bunnyFiles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Upload file from URL
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
        const urlPath = new URL(args.url).pathname;
        filename = urlPath.split("/").pop() || "downloaded-file";
      }

      // Get file content as blob
      const blob = await response.blob();

      // Get site URL for upload
      const siteUrl = (process.env.CONVEX_SITE_URL ?? "").replace(
        /\.cloud$/,
        ".site",
      );

      // Upload blob to ConvexFS
      const uploadResponse = await fetch(`${siteUrl}/fs/upload`, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const { blobId } = await uploadResponse.json();

      // Commit the file - create path with timestamp
      const timestamp = Date.now();
      const path = `/${timestamp}-${filename}`;

      await fs.commitFiles(ctx, [
        {
          path,
          blobId,
        },
      ]);

      // Save metadata to database
      await ctx.runMutation(api.bunnyStorage.saveFileMetadata, {
        path,
        blobId,
        filename,
        fileSize,
        mimeType: contentType,
      });

      return {
        success: true,
        filename,
        fileSize,
        mimeType: contentType,
        path,
      };
    } catch (error) {
      console.error("URL upload error:", error);
      throw new Error(
        `Failed to upload from URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
});
