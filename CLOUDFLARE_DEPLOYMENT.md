# Cloudflare Workers Deployment Guide

This project is configured to deploy on Cloudflare Workers/Pages.

## Prerequisites

1. A Cloudflare account (sign up at https://dash.cloudflare.com/sign-up)
2. Node.js and npm installed
3. Wrangler CLI installed (included in dev dependencies)

## Initial Setup

### 1. Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

### 2. Configure Your Project

The `wrangler.toml` file contains the project configuration. You may want to update:

- `name`: The name of your worker (currently "drift0")
- `compatibility_date`: Keep this updated to get latest features

## Deployment Commands

### Build the project

```bash
npm run build
```

This runs Astro's build process and creates a `dist/` directory with your compiled application.

### Deploy to Cloudflare Pages

```bash
npm run cf:deploy
```

Or build and deploy in one command:

```bash
npm run cf:build-deploy
```

### Local Testing with Cloudflare

To test your build locally with the Cloudflare runtime:

```bash
npm run build
npm run cf:dev
```

This runs your built application using Wrangler's local development server.

## First Deployment

For your first deployment, you'll need to create a Pages project:

```bash
npm run build
npx wrangler pages deploy ./dist --project-name=drift0
```

Follow the prompts to:
1. Choose a project name (or use "drift0")
2. Select your production branch (usually "main")

## Subsequent Deployments

After the first deployment, you can simply run:

```bash
npm run cf:build-deploy
```

## Environment Variables

If you need environment variables for your production deployment:

1. Go to your Cloudflare dashboard
2. Navigate to Workers & Pages > Your Project > Settings > Environment Variables
3. Add your variables there

For local development with environment variables:

1. Create a `.dev.vars` file in the project root
2. Add your variables in KEY=VALUE format
3. This file is gitignored for security

## Custom Domain

To add a custom domain:

1. Go to your Cloudflare dashboard
2. Navigate to Workers & Pages > Your Project > Custom Domains
3. Click "Set up a custom domain"
4. Follow the instructions to add your domain

## Monitoring and Logs

View your deployment logs and analytics:

```bash
npx wrangler pages deployment list --project-name=drift0
```

Or view logs in the Cloudflare dashboard under Workers & Pages.

## Rollback

To rollback to a previous deployment:

1. Go to Cloudflare dashboard
2. Navigate to Workers & Pages > Your Project > Deployments
3. Find the deployment you want to rollback to
4. Click "Rollback to this deployment"

## Differences from Node.js Deployment

The Cloudflare adapter uses the same code but runs in the Cloudflare Workers runtime:

- Uses V8 isolates instead of Node.js processes
- Has different size and execution time limits
- Some Node.js APIs may not be available (but `nodejs_compat` flag helps)
- Better global performance with edge network deployment

## Troubleshooting

### Build fails

Make sure all dependencies are installed:
```bash
npm install
```

### Deployment fails

Check Wrangler authentication:
```bash
npx wrangler whoami
```

### Runtime errors

Check the Cloudflare dashboard logs or use:
```bash
npx wrangler pages deployment tail --project-name=drift0
```

## Resources

- [Astro Cloudflare Adapter Docs](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
