import { R2 } from "@convex-dev/r2";
import { components, internal } from "./_generated/api";
import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize R2 component (same instance as files.ts)
export const r2 = new R2(components.r2);

// Internal mutation to create upload record
export const createUploadRecord = internalMutation({
  args: {
    uploadId: v.string(),
    storageKey: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    totalSize: v.number(),
    parts: v.array(
      v.object({
        partNumber: v.number(),
        size: v.number(),
        status: v.union(
          v.literal("pending"),
          v.literal("uploading"),
          v.literal("completed"),
          v.literal("failed"),
        ),
      }),
    ),
    totalParts: v.number(),
  },
  handler: async (ctx, args) => {
    const uploadRecordId = await ctx.db.insert("multipartUploads", {
      uploadId: args.uploadId,
      storageKey: args.storageKey,
      filename: args.filename,
      mimeType: args.mimeType,
      totalSize: args.totalSize,
      status: "initiating",
      parts: args.parts,
      uploadedParts: 0,
      totalParts: args.totalParts,
      bytesUploaded: 0,
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    });
    return uploadRecordId;
  },
});

// Internal mutation to update upload status
export const updateUploadStatus = internalMutation({
  args: {
    uploadRecordId: v.id("multipartUploads"),
    status: v.union(
      v.literal("initiating"),
      v.literal("in_progress"),
      v.literal("completing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("aborted"),
    ),
    errorMessage: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const update: any = {
      status: args.status,
      lastActivityAt: Date.now(),
    };

    if (args.errorMessage) {
      update.errorMessage = args.errorMessage;
    }

    if (args.completedAt) {
      update.completedAt = args.completedAt;
    }

    await ctx.db.patch(args.uploadRecordId, update);
  },
});

// Action: Initiate multipart upload
export const initiateMultipartUpload = action({
  args: {
    filename: v.string(),
    mimeType: v.string(),
    totalSize: v.number(),
    chunkSize: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Generate unique storage key
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const storageKey = `large-uploads/${timestamp}-${random}-${args.filename}`;

      // Calculate total parts
      const totalParts = Math.ceil(args.totalSize / args.chunkSize);

      // Create S3 multipart upload
      const command = new CreateMultipartUploadCommand({
        Bucket: r2.config.bucket,
        Key: storageKey,
        ContentType: args.mimeType,
      });

      const response = await r2.client.send(command);

      if (!response.UploadId) {
        throw new Error("Failed to initiate multipart upload");
      }

      // Initialize parts array
      const parts = Array.from({ length: totalParts }, (_, i) => ({
        partNumber: i + 1,
        size:
          i === totalParts - 1
            ? args.totalSize - i * args.chunkSize // Last part
            : args.chunkSize,
        status: "pending" as const,
      }));

      // Save to database
      const uploadRecordId = await ctx.runMutation(
        internal.largeFiles.createUploadRecord,
        {
          uploadId: response.UploadId,
          storageKey,
          filename: args.filename,
          mimeType: args.mimeType,
          totalSize: args.totalSize,
          parts,
          totalParts,
        },
      );

      // Update status to in_progress
      await ctx.runMutation(internal.largeFiles.updateUploadStatus, {
        uploadRecordId,
        status: "in_progress",
      });

      // return {
      //   uploadRecordId,
      //   uploadId: response.UploadId,
      //   storageKey,
      //   totalParts,
      // };
    } catch (error) {
      console.error("Failed to initiate multipart upload:", error);
      throw error;
    }
  },
});

// Action: Generate presigned URLs for parts
export const generatePartUploadUrls = action({
  args: {
    uploadRecordId: v.id("multipartUploads"),
    partNumbers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Get upload record
      const upload = await ctx.runQuery(internal.largeFiles.getUploadRecord, {
        uploadRecordId: args.uploadRecordId,
      });

      if (!upload) {
        throw new Error("Upload record not found");
      }

      // Generate presigned URLs for each part
      const urls = await Promise.all(
        args.partNumbers.map(async (partNumber) => {
          const command = new UploadPartCommand({
            Bucket: r2.config.bucket,
            Key: upload.storageKey,
            UploadId: upload.uploadId,
            PartNumber: partNumber,
          });

          const url = await getSignedUrl(r2.client, command, {
            expiresIn: 3600, // 1 hour
          });

          // return {
          //   partNumber,
          //   uploadUrl: url,
          // };
        }),
      );

      return urls;
    } catch (error) {
      console.error("Failed to generate part upload URLs:", error);
      throw error;
    }
  },
});

// Internal query to get upload record
export const getUploadRecord = internalQuery({
  args: {
    uploadRecordId: v.id("multipartUploads"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.uploadRecordId);
  },
});

// Mutation: Confirm part upload
export const confirmPartUpload = mutation({
  args: {
    uploadRecordId: v.id("multipartUploads"),
    partNumber: v.number(),
    etag: v.string(),
  },
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.uploadRecordId);
    if (!upload) {
      throw new Error("Upload record not found");
    }

    // Update part in parts array
    const updatedParts = upload.parts.map((part) => {
      if (part.partNumber === args.partNumber) {
        return {
          ...part,
          etag: args.etag,
          status: "completed" as const,
        };
      }
      return part;
    });

    // Calculate progress
    const uploadedParts = updatedParts.filter(
      (p) => p.status === "completed",
    ).length;
    const bytesUploaded = updatedParts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.size, 0);

    // Update database
    await ctx.db.patch(args.uploadRecordId, {
      parts: updatedParts,
      uploadedParts,
      bytesUploaded,
      lastActivityAt: Date.now(),
    });

    const progress = (uploadedParts / upload.totalParts) * 100;

    return {
      progress,
      uploadedParts,
      totalParts: upload.totalParts,
      bytesUploaded,
      totalSize: upload.totalSize,
    };
  },
});

// Action: Complete multipart upload
export const completeMultipartUpload = action({
  args: {
    uploadRecordId: v.id("multipartUploads"),
  },
  handler: async (ctx, args) => {
    try {
      // Get upload record
      const upload = await ctx.runQuery(internal.largeFiles.getUploadRecord, {
        uploadRecordId: args.uploadRecordId,
      });

      if (!upload) {
        throw new Error("Upload record not found");
      }

      // Verify all parts have ETags
      const allPartsComplete = upload.parts.every((part) => part.etag);
      if (!allPartsComplete) {
        throw new Error("Not all parts have been uploaded");
      }

      // Build Parts array for S3 completion (sorted by part number)
      const parts = upload.parts
        .sort((a, b) => a.partNumber - b.partNumber)
        .map((part) => ({
          PartNumber: part.partNumber,
          ETag: part.etag!,
        }));

      // Update status to completing
      await ctx.runMutation(internal.largeFiles.updateUploadStatus, {
        uploadRecordId: args.uploadRecordId,
        status: "completing",
      });

      // Send CompleteMultipartUploadCommand
      const command = new CompleteMultipartUploadCommand({
        Bucket: r2.config.bucket,
        Key: upload.storageKey,
        UploadId: upload.uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });

      await r2.client.send(command);

      // Update status to completed
      await ctx.runMutation(internal.largeFiles.updateUploadStatus, {
        uploadRecordId: args.uploadRecordId,
        status: "completed",
        completedAt: Date.now(),
      });

      // return {
      //   success: true,
      //   storageKey: upload.storageKey,
      // };
    } catch (error) {
      console.error("Failed to complete multipart upload:", error);

      // Update status to failed
      await ctx.runMutation(internal.largeFiles.updateUploadStatus, {
        uploadRecordId: args.uploadRecordId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

// Action: Abort multipart upload
export const abortMultipartUpload = action({
  args: {
    uploadRecordId: v.id("multipartUploads"),
  },
  handler: async (ctx, args) => {
    try {
      // Get upload record
      const upload = await ctx.runQuery(internal.largeFiles.getUploadRecord, {
        uploadRecordId: args.uploadRecordId,
      });

      if (!upload) {
        throw new Error("Upload record not found");
      }

      // Send AbortMultipartUploadCommand
      const command = new AbortMultipartUploadCommand({
        Bucket: r2.config.bucket,
        Key: upload.storageKey,
        UploadId: upload.uploadId,
      });

      await r2.client.send(command);

      // Update status to aborted
      await ctx.runMutation(internal.largeFiles.updateUploadStatus, {
        uploadRecordId: args.uploadRecordId,
        status: "aborted",
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to abort multipart upload:", error);
      throw error;
    }
  },
});

// Query: Get upload progress
export const getUploadProgress = query({
  args: {
    uploadRecordId: v.id("multipartUploads"),
  },
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.uploadRecordId);
    if (!upload) {
      return null;
    }

    const progress = (upload.uploadedParts / upload.totalParts) * 100;

    return {
      ...upload,
      progress,
    };
  },
});

// Query: List multipart uploads
export const listMultipartUploads = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let uploads;

    if (args.status) {
      uploads = await ctx.db
        .query("multipartUploads")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc")
        .collect();
    } else {
      uploads = await ctx.db.query("multipartUploads").order("desc").collect();
    }

    // Add progress calculation
    return uploads.map((upload) => ({
      ...upload,
      progress: (upload.uploadedParts / upload.totalParts) * 100,
    }));
  },
});

// Query: Get completed file with download URL
export const getCompletedFile = query({
  args: {
    uploadRecordId: v.id("multipartUploads"),
  },
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.uploadRecordId);

    if (!upload) {
      return null;
    }

    if (upload.status !== "completed") {
      throw new Error("Upload is not completed yet");
    }

    // Generate download URL
    const url = await r2.getUrl(upload.storageKey, {
      expiresIn: 3600, // 1 hour
    });

    return {
      ...upload,
      url,
    };
  },
});

// Action: Delete multipart file
export const deleteMultipartFile = action({
  args: {
    uploadRecordId: v.id("multipartUploads"),
  },
  handler: async (ctx, args) => {
    try {
      // Get upload record
      const upload = await ctx.runQuery(internal.largeFiles.getUploadRecord, {
        uploadRecordId: args.uploadRecordId,
      });

      if (!upload) {
        throw new Error("Upload record not found");
      }

      // Delete from R2 if completed
      if (upload.status === "completed") {
        await r2.deleteObject(ctx, upload.storageKey);
      }

      // Delete database record
      await ctx.runMutation(internal.largeFiles.deleteUploadRecord, {
        uploadRecordId: args.uploadRecordId,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to delete multipart file:", error);
      throw error;
    }
  },
});

// Internal mutation to delete upload record
export const deleteUploadRecord = internalMutation({
  args: {
    uploadRecordId: v.id("multipartUploads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.uploadRecordId);
  },
});
