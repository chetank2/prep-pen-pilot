# Prep Pen Pilot - AI-Powered Study Assistant

> **✅ UPDATE**: Localhost 500 errors have been fixed! See [FIXES_APPLIED.md](./FIXES_APPLIED.md) for details.

## 🚀 Status Update (Jun 2, 2025)

### ✅ Working on Localhost
- **Backend API**: All endpoints responding correctly
- **Categories**: Returns 6 default categories  
- **Knowledge Items**: Properly handles UUID validation
- **Error Handling**: Improved with proper fallbacks
- **TypeScript**: All type errors resolved

### ⚠️ Pending Setup
- **Storage Buckets**: Need to be created in Supabase (see [setup guide](./scripts/setup-storage-buckets.sql))
- **File Uploads**: Will work after bucket setup

### 🧪 Quick Test
```bash
# Test the fixed endpoints
curl "http://localhost:3001/api/health"                    # ✅ Working
curl "http://localhost:3001/api/knowledge-base/categories"  # ✅ Working  
curl "http://localhost:3001/api/knowledge-base/items"       # ✅ Working
```

---

## Overview

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9ea16a9a-d254-45a3-b509-f8d5cba73fd5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9ea16a9a-d254-45a3-b509-f8d5cba73fd5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9ea16a9a-d254-45a3-b509-f8d5cba73fd5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
