import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUploadFile } from "@convex-dev/r2/react";
import { ArrowLeft, HardDrive, CheckCircle2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { FileUploader } from "./r2-storage/components/FileUploader";
import { FileList } from "./r2-storage/components/FileList";

export const Route = createFileRoute("/r2-storage")({
  component: R2StorageDemo,
});

function R2StorageDemo() {
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Convex hooks
  const files = useQuery(api.files.listFiles);
  const saveFileMetadata = useMutation(api.files.saveFileMetadata);
  const deleteFile = useMutation(api.files.deleteFile);

  // R2 upload hook - pass the generateUploadUrl mutation
  const uploadFile = useUploadFile({
    generateUploadUrl: api.files.generateUploadUrl,
    syncMetadata: api.files.syncMetadata,
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    setSuccessMessage(null);

    try {
      // Upload file to R2 via Convex component
      const storageKey = await uploadFile(file);

      // Save metadata to Convex database
      await saveFileMetadata({
        storageKey,
        filename: file.name,
        originalFilename: file.name,
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
          <HardDrive className="w-10 h-10 text-cyan-400" />
          <h1 className="text-4xl font-bold text-white">
            Cloudflare R2 Storage
          </h1>
        </div>

        <p className="text-gray-400 mb-8 text-lg">
          Upload, store, and manage files using Cloudflare R2 object storage,
          seamlessly integrated with Convex.
        </p>

        {/* How It Works Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold mb-2">
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
              <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold mb-2">
                2
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Upload to R2
              </h3>
              <p className="text-xs text-gray-400">
                File uploads directly to Cloudflare R2 storage
              </p>
            </div>
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold mb-2">
                3
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Save Metadata
              </h3>
              <p className="text-xs text-gray-400">
                File info stored in Convex database
              </p>
            </div>
            <div className="flex flex-col">
              <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold mb-2">
                4
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Access Files
              </h3>
              <p className="text-xs text-gray-400">
                Download or delete files anytime
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
          <h2 className="text-2xl font-semibold text-white mb-4">
            Upload File
          </h2>
          <FileUploader onUpload={handleUpload} uploading={uploading} />
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
              <h3 className="text-cyan-400 font-medium mb-2">
                Component Setup
              </h3>
              <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-gray-300">
                <code>{`// convex/convex.config.ts
import { defineApp } from 'convex/server'
import r2 from '@convex-dev/r2/convex.config'

const app = defineApp()
app.use(r2)
export default app`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-cyan-400 font-medium mb-2">
                Upload File (React)
              </h3>
              <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-gray-300">
                <code>{`import { useUploadFile } from '@convex-dev/r2/react'

const uploadFile = useUploadFile()
const storageKey = await uploadFile(file)`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-cyan-400 font-medium mb-2">
                List Files (Convex Function)
              </h3>
              <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-gray-300">
                <code>{`export const listFiles = query({
  handler: async (ctx) => {
    const files = await ctx.db.query('files').collect()
    return Promise.all(files.map(async (file) => ({
      ...file,
      url: await r2.getUrl(ctx, file.storageKey)
    })))
  }
})`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
