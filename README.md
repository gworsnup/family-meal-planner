This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Vercel Blob (TikTok thumbnails)

TikTok recipe imports persist thumbnails to Vercel Blob to avoid expiring CDN URLs. Ensure `BLOB_READ_WRITE_TOKEN` is available in your environment (Vercel injects this automatically when the Blob integration is enabled). For local development, use `vercel env pull` or add the token to `.env.local`.

## Mobile PWA

The authenticated mobile experience starts at `/mobile`. On iPhone, open that URL in Safari, tap Share, then choose **Add to Home Screen**. The installed app opens the current week's plan and also provides recipe import/review, the recipe library, cooking mode, alternate weeks, WhatsApp sharing, and a view-focused shopping checklist.

The manifest includes a standards-based Web Share Target at `/share`. iOS Safari does not currently register PWAs as Share Sheet destinations, so FamilyTable provides a token-authenticated iOS Shortcut integration:

1. In the installed PWA, open **Import → Set up Shortcut**.
2. Generate a revocable token and follow the on-screen steps to create the **Save Recipe** Shortcut.
3. In Instagram or TikTok, choose **Share → Save Recipe**.

The Shortcut sends the URL to `POST /api/shortcut/import`, which queues the existing `runRecipeImport` pipeline for the token's workspace. Browsers that support Web Share Target can send a shared URL directly to the import screen. The manual paste flow remains available as a fallback.
