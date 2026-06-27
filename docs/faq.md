# FAQ

## General

### What is DevFlow?
DevFlow is an open-source operations cockpit for freelancers and small teams. It provides dashboard, project management, financial tracking, time tracking, and investment management in a single web application.

### Who is it for?
Solo freelancers, independent professionals, and small teams who need a simple but complete system to manage their day-to-day operations.

### Is it free?
Yes, DevFlow is open source under the MIT License. You only pay for your Supabase hosting (free tier available).

## Technical

### Do I need a server?
No. DevFlow uses Supabase as its backend, so you only need a Supabase account (free tier works) and a way to host the frontend (Vercel free tier recommended).

### Can I use my own database?
DevFlow is designed for Supabase/PostgreSQL. While you could adapt the data layer, it would require significant changes to the codebase.

### Does it work offline?
Not currently. Offline mode with IndexedDB is on the roadmap.

### Can I self-host?
Yes. Deploy the frontend to any static host (Vercel, Netlify, Cloudflare Pages) and connect it to your Supabase project.

## Features

### Can I add more currencies?
The available currencies are CVE, USD, and EUR. Multi-currency support with exchange rates is on the roadmap.

### Can I invite team members?
Auth has been temporarily removed to simplify setup. A guest/demo mode and multi-user support may be added in the future.

### How do I export my data?
Use the export buttons on each page. Available formats: CSV, Excel (.xlsx), and PDF.

## Troubleshooting

### The app shows "Failed to load"
Check that:
1. Your Supabase project is accessible
2. The environment variables are correctly set
3. The database tables have been created
4. The RLS policies have been applied

### Charts are not rendering
Make sure your browser supports SVG (all modern browsers do). Try clearing your cache.

### Data is not updating in real-time
The app uses polling as fallback. If realtime is not working, data will refresh every 8-15 seconds.
