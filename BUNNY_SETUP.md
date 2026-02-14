# Bunny.net Storage Setup Guide

This guide will help you set up Bunny.net storage with ConvexFS for the playground.

## Prerequisites

1. A Bunny.net account ([sign up here](https://bunny.net))
2. Node.js and npm installed
3. A Convex project set up

## Installation

The `convex-fs` package has been added to your `package.json`. Install it:

```bash
npm install
```

If you encounter npm errors, try:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Bunny.net Configuration

### Step 1: Create a Storage Zone

1. Log in to your [Bunny.net dashboard](https://panel.bunny.net)
2. Navigate to **Storage** → **Add Storage Zone**
3. Choose a name for your storage zone (e.g., `my-storage-zone`)
4. Select a region (or leave default)
5. Click **Add Storage Zone**

### Step 2: Get Your API Key

1. In the Bunny.net dashboard, go to **Account** → **Account Settings**
2. Scroll down to **API** section
3. Copy your **Storage API Key**

### Step 3: Create a Pull Zone (CDN)

1. Navigate to **CDN** → **Add Pull Zone**
2. Choose a name (e.g., `my-cdn`)
3. Under **Origin**, select **Storage Zone** and choose the storage zone you created
4. Click **Add Pull Zone**
5. Copy the **CDN Hostname** (looks like `xxxxx.b-cdn.net`)

### Step 4: (Optional) Enable Token Authentication

For signed URLs with expiration:

1. In your Pull Zone settings, go to **Security**
2. Enable **Token Authentication**
3. Generate a **Token Authentication Key**
4. Copy the key

## Environment Variables

Add these environment variables to your Convex project:

### Using Convex Dashboard

1. Go to your [Convex dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

```bash
BUNNY_API_KEY=your-storage-api-key-here
BUNNY_STORAGE_ZONE=your-storage-zone-name
BUNNY_CDN_HOSTNAME=xxxxx.b-cdn.net
BUNNY_REGION=de  # Optional: de, ny, la, sg, syd (default is primary region)
BUNNY_TOKEN_KEY=your-token-key-here  # Optional: for signed URLs
```

### Using `.env.local` (Development)

Create a `.env.local` file in your project root:

```bash
BUNNY_API_KEY=your-storage-api-key-here
BUNNY_STORAGE_ZONE=your-storage-zone-name
BUNNY_CDN_HOSTNAME=xxxxx.b-cdn.net
BUNNY_REGION=de
BUNNY_TOKEN_KEY=your-token-key-here
```

## Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to [http://localhost:3000/bunny-storage](http://localhost:3000/bunny-storage)

3. Try uploading a file:
   - Drag and drop a file
   - Or click "browse files"
   - Or use "Upload from URL"

4. Verify the file appears in your Bunny.net storage:
   - Go to Bunny.net dashboard → **Storage** → Your storage zone
   - You should see the uploaded files

## Architecture

The bunny storage implementation uses a two-step upload process:

1. **Upload Blob**: File is POSTed to `/fs/upload` endpoint → returns a `blobId`
2. **Commit File**: Action calls `fs.commitFiles()` with the `blobId` and a filesystem path

### File Structure

```
convex/
├── bunnyFs.ts          # ConvexFS instance configuration
├── bunnyStorage.ts     # Backend mutations/queries/actions
├── http.ts             # HTTP routes for blob upload
├── convex.config.ts    # Component registration
└── schema.ts           # Database schema (bunnyFiles table)

src/routes/
├── bunny-storage.tsx   # Main route component
└── bunny-storage/
    ├── constants.ts    # File validation and utilities
    └── components/
        ├── FileUploader.tsx   # Direct file upload
        ├── UrlUploader.tsx    # URL-based upload
        ├── FileList.tsx       # File gallery
        └── FileCard.tsx       # Individual file card
```

## Backend API

### Actions

- `commitFile({ blobId, filename, fileSize, mimeType })` - Commit uploaded blob to ConvexFS
- `uploadFromUrl({ url, filename? })` - Upload file from external URL
- `deleteFile({ id })` - Delete file from both storage and database

### Queries

- `listFiles()` - Get all files with signed download URLs
- `getFile({ id })` - Get single file with download URL

### Mutations

- `saveFileMetadata(...)` - Save file metadata to database
- `deleteFileMetadata({ id })` - Remove file metadata from database

## Frontend API

### Upload Flow

```typescript
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

// 1. Upload blob
const siteUrl = import.meta.env.VITE_CONVEX_URL.replace(/\.cloud$/, ".site");
const response = await fetch(`${siteUrl}/fs/upload`, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});
const { blobId } = await response.json();

// 2. Commit file
const commitFile = useAction(api.bunnyStorage.commitFile);
await commitFile({
  blobId,
  filename: file.name,
  fileSize: file.size,
  mimeType: file.type,
});
```

## Troubleshooting

### "Cannot read properties of null" during npm install

This is a npm cache issue. Try:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Upload fails with 404

Check that:
1. Your Convex deployment is running (`npx convex dev`)
2. Environment variables are set correctly
3. The `/fs/upload` route is registered in `convex/http.ts`

### Files not showing in list

Check:
1. The `bunnyFiles` schema exists in `convex/schema.ts`
2. The file was successfully committed (check Convex dashboard logs)
3. The query is running without errors

### CDN URLs not working

Verify:
1. Your CDN hostname is correct
2. The Pull Zone is properly linked to your Storage Zone
3. Token authentication settings match your configuration

## Resources

- [ConvexFS Documentation](https://convexfs.dev)
- [Bunny.net Documentation](https://docs.bunny.net)
- [Convex Documentation](https://docs.convex.dev)
- [ConvexFS GitHub](https://github.com/jamwt/convex-fs)
