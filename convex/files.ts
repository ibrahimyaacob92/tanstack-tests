import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { R2 } from "@convex-dev/r2";
import type { DataModel } from "./_generated/dataModel";

// Initialize R2 component
export const r2 = new R2(components.r2);

// Generate upload URL and sync metadata functions using R2 client API
export const { generateUploadUrl, syncMetadata, onSyncMetadata } =
  r2.clientApi<DataModel>({
    checkUpload: async (ctx, bucket) => {
      // Optional: Add upload validation here
      // For now, allow all uploads
    },
    onUpload: async (ctx, bucket, key) => {
      // Optional: Handle post-upload logic
      // We'll handle metadata saving manually in saveFileMetadata
      console.log(`File uploaded: ${key} to bucket: ${bucket}`);
    },
    onSyncMetadata: async (ctx, args) => {
      // Optional: Log metadata sync
      const metadata = await r2.getMetadata(ctx, args.key);
      console.log("Synced metadata:", metadata);
    },
  });

// Save file metadata after upload
export const saveFileMetadata = mutation({
  args: {
    storageKey: v.string(),
    filename: v.string(),
    originalFilename: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("files", {
      storageKey: args.storageKey,
      filename: args.filename,
      originalFilename: args.originalFilename,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      uploadedAt: Date.now(),
      description: args.description,
    });
    return fileId;
  },
});

// Get a single file by ID with download URL
export const getFile = query({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) {
      return null;
    }

    // Generate download URL from R2 (expires in 1 hour)
    const url = await r2.getUrl(file.storageKey, {
      expiresIn: 60 * 60, // 1 hour in seconds
    });

    return {
      ...file,
      url,
    };
  },
});

// List all files with download URLs
export const listFiles = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").order("desc").collect();

    // Generate URLs for all files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await r2.getUrl(file.storageKey, {
          expiresIn: 60 * 60, // 1 hour
        });
        return {
          ...file,
          url,
        };
      }),
    );

    return filesWithUrls;
  },
});

// Delete a file from both R2 and database
export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) {
      throw new Error("File not found");
    }

    // Delete from R2 storage
    await r2.deleteObject(ctx, file.storageKey);

    // Delete from database
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Get file metadata from R2
export const getFileMetadata = query({
  args: { storageKey: v.string() },
  handler: async (ctx, args) => {
    const metadata = await r2.getMetadata(ctx, args.storageKey);
    return metadata;
  },
});
