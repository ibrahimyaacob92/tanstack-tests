# Deployment Guide

## Deploy to Railway

This project is configured to deploy to Railway using Railpack.

### Prerequisites

- Railway account ([railway.app](https://railway.app))
- Railway CLI (optional): `npm i -g @railway/cli`

### Configuration Files

- [railpack.json](railpack.json) - Railpack build configuration
- [railway.json](railway.json) - Railway deployment configuration

### Deployment Steps

#### Option 1: Deploy via Railway Dashboard

1. Go to [railway.app](https://railway.app) and log in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect and use the Railpack configuration
6. Wait for the build and deployment to complete
7. Your app will be live at the provided Railway URL

#### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project (first time only)
railway init

# Deploy
railway up
```

### Environment Variables

No environment variables are required for basic deployment. If you need to add any:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add your environment variables

### Build Configuration

The project uses:
- **Node.js Version**: 22
- **Package Manager**: pnpm
- **Build Command**: `pnpm run build`
- **Start Command**: `pnpm start`

### Deployment Settings

- **Builder**: Railpack
- **Restart Policy**: ON_FAILURE
- **Max Retries**: 10

### Troubleshooting

If deployment fails:

1. Check that Node.js version 22 is being used
2. Verify build logs in Railway dashboard
3. Ensure all dependencies are listed in package.json
4. Check that the build completes successfully locally: `pnpm run build`

### Local Testing

Test the production build locally:

```bash
# Build the project
pnpm run build

# Start the production server
pnpm start
```

The app should run on `http://localhost:3000`
