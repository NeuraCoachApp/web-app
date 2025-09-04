# AI Coach

A Next.js web application built with TypeScript and Tailwind CSS, featuring folder-based routing.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Folder-based Routing** - Using Next.js App Router

## Project Structure

```
app/
├── globals.css          # Global styles with Tailwind directives
├── layout.tsx           # Root layout component
├── page.tsx             # Home page (/)
├── about/
│   └── page.tsx         # About page (/about)
└── dashboard/
    ├── page.tsx         # Dashboard page (/dashboard)
    └── settings/
        └── page.tsx     # Settings page (/dashboard/settings)
```

## Available Routes

- `/` - Home page
- `/about` - About page
- `/dashboard` - Dashboard page
- `/dashboard/settings` - Settings page

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
