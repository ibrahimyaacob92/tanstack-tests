import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { ArrowLeft, Rabbit, CheckCircle2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { FileUploader } from "./bunny-storage/components/FileUploader";
import { FileList } from "./bunny-storage/components/FileList";
import { UrlUploader } from "./bunny-storage/components/UrlUploader";

export const Route = createFileRoute("/bunny-storage")({
  component: BunnyStorageDemo,
});

function BunnyStorageDemo() {
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Convex hooks
  const files = useQuery(api.bunnyStorage.listFiles);
  const deleteFile = useAction(api.bunnyStorage.deleteFile);
  const commitFile = useAction(api.bunnyStorage.commitFile);
  const uploadFromUrl = useAction(api.bunnyStorage.uploadFromUrl);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setSuccessMessage(null);

    try {
      // Get site URL for upload
      const siteUrl = (import.meta.env.VITE_CONVEX_URL ?? "").replace(
        /\.cloud$/,
        ".site"
      );

      // 1. Upload blob to ConvexFS
      const response = await fetch(`${siteUrl}/fs/upload`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const { blobId } = await response.json();

      // 2. Commit the file to ConvexFS
      await commitFile({
        blobId,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      setSuccessMessage(`File "${file.name}" uploaded successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = async (url: string, filename?: string) => {
    setUploading(true);
    setSuccessMessage(null);

    try {
      const result = await uploadFromUrl({ url, filename });
      setSuccessMessage(
        `File "${result.filename}" uploaded from URL successfully!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("URL upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFile({ id: id as any });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experiments
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <Rabbit className="w-10 h-10 text-orange-400" />
          <h1 className="text-4xl font-bold text-white">
            Bunny.net Storage with ConvexFS
          </h1>
        </div>

        <p className="text-gray-400 mb-8 text-lg">
          Upload, store, and manage files using Bunny.net Edge Storage via
          ConvexFS, a virtual filesystem component for Convex.
        </p>

        {/* How It Works Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold mb-2">
                1
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Select File
              </h3>
              <p className="text-xs text-gray-400">
                Drag and drop or browse to select a file
              </p>
            </div>
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold mb-2">
                2
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Upload Blob
              </h3>
              <p className="text-xs text-gray-400">
                File uploads to Bunny.net Edge Storage as a blob
              </p>
            </div>
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold mb-2">
                3
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Commit to Path
              </h3>
              <p className="text-xs text-gray-400">
                ConvexFS commits blob to a filesystem path
              </p>
            </div>
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold mb-2">
                4
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Serve via CDN
              </h3>
              <p className="text-xs text-gray-400">
                Files served through Bunny.net global CDN
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-sm text-green-200">{successMessage}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Upload File
          </h2>

          <div className="space-y-6">
            {/* Direct File Upload */}
            <FileUploader onUpload={handleUpload} uploading={uploading} />

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900 text-gray-400 font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* URL Upload */}
            <UrlUploader onUpload={handleUrlUpload} uploading={uploading} />
          </div>
        </div>

        {/* Files Gallery */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Your Files {files && files.length > 0 && `(${files.length})`}
          </h2>
          <FileList files={files} onDelete={handleDelete} />
        </div>

        {/* API Reference */}
        <div className="mt-12 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            API Reference
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-orange-400 font-medium mb-2">
                Component Setup
              </h3>
              <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-gray-300">
                <code>{`// convex/convex.config.ts
import { defineApp } from 'convex/server'
import fs from 'convex-fs/convex.config.js'

const app = defineApp()
app.use(fs)
export default app`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-orange-400 font-medium mb-2">
                ConvexFS Instance
              </h3>
              <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-gray-300">
                <code>{`// convex/bunnyFs.ts
import { ConvexFS } from 'convex-fs'
import { components } from './_generated/api'

export const fs = new ConvexFS(components.fs, {
  storage: {
    type: 'bunny',
    apiKey: process.env.BUNNY_API_KEY!,
    storageZoneName: process.env.BUNNY_STORAGE_ZONE!,
    cdnHostname: process.env.BUNNY_CDN_HOSTNAME!,
  },
})`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-orange-400 font-medium mb-2">
                Upload File (Two-Step Process)
              </h3>
              <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-gray-300">
                <code>{`// 1. Upload blob
const res = await fetch(\`\${siteUrl}/fs/upload\`, {
  method: 'POST',
  headers: { 'Content-Type': file.type },
  body: file,
})
const { blobId } = await res.json()

// 2. Commit to path
await fs.commitFiles(ctx, [{
  path: '/myfile.jpg',
  blobId
}])`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-orange-400 font-medium mb-2">
                Environment Variables
              </h3>
              <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-gray-300">
                <code>{`BUNNY_API_KEY=your_api_key
BUNNY_STORAGE_ZONE=your_storage_zone
BUNNY_CDN_HOSTNAME=your_cdn_hostname.b-cdn.net
BUNNY_TOKEN_KEY=your_token_key (optional)`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
