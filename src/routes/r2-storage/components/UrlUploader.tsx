import { useState } from "react";
import { Link2, Upload } from "lucide-react";

interface UrlUploaderProps {
  onUpload: (url: string, filename?: string) => Promise<void>;
  uploading: boolean;
}

export function UrlUploader({ onUpload, uploading }: UrlUploaderProps) {
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    try {
      await onUpload(url, filename || undefined);
      setUrl("");
      setFilename("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link2 className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">
          Upload from URL
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="file-url"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            File URL
          </label>
          <input
            id="file-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/file.pdf"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            disabled={uploading}
          />
        </div>

        <div>
          <label
            htmlFor="filename"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Filename (optional)
          </label>
          <input
            id="filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="custom-name.pdf"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            disabled={uploading}
          />
          <p className="mt-1 text-xs text-gray-500">
            If not provided, filename will be extracted from URL
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !url.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          <Upload className="w-5 h-5" />
          {uploading ? "Uploading..." : "Upload from URL"}
        </button>
      </form>
    </div>
  );
}
