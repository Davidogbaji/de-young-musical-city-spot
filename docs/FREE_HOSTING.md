# Free hosting until you buy a domain

This puts the whole shop online for free on temporary addresses like `deyoung-shop.netlify.app`. Plans and limits change often, so check each provider's pricing page before you start. Facts below were checked in October 2026.

| Part | Where | Why |
|---|---|---|
| Database | **Neon** (Postgres) | Free plan has no expiry: 0.5 GB storage, sleeps when idle, wakes on demand. |
| Backend (API) | **Render** web service | Free instance, no card needed. |
| Website | **Netlify** | Free plan can be used for commercial sites (Netlify staff confirmed this in their forum), and it can pass `/api` calls through to the backend. |
| Product photos | **Cloudinary** | Render's disk is wiped on restart, so photos must live elsewhere. |

## What "free" means (the honest limits)
- **Render free backend sleeps after 15 minutes without visitors.** The next visitor waits about a minute while it wakes up. Fine for testing and demos. Not good for real customers.
- **Do not use Render's free database.** It expires after 30 days. That is why Neon is used.
- Render gives free web services 750 hours a month in total, which is about one service running nonstop.
- Netlify cuts proxied requests that take longer than 26 seconds, so the very first visit after a sleep can show an error. Refresh and it works.
- **Option to keep it awake:** a free uptime monitor that opens `https://YOUR-BACKEND.onrender.com/api/health` every 5 minutes stops the sleeping. Check that service's current free terms.
- When you are ready for real customers, a paid Render instance (about $7 a month at the time of writing) removes the sleeping. Everything else can stay free.

## Why the setup looks a little unusual
Customer logins use a cookie, and browsers only keep it when the website and the API share one address. On free addresses they would be different (`netlify.app` and `onrender.com`), and logins would silently fail. So Netlify forwards every `/api/...` request to Render. The browser only ever sees one address, and logins work. When you buy a domain you can keep this, or switch to `www` + `api` subdomains.

## Step 1: Put the project on GitHub
1. Create a free account at github.com and a **private** repository named `de-young-musical-city-spot`.
2. In VS Code, open the project folder and run:
   ```bash
   git init
   git add .
   git commit -m "First version"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/de-young-musical-city-spot.git
   git push -u origin main
   ```
3. Check that `backend/prisma/migrations` (created when you ran `prisma migrate dev`) was uploaded. Render needs it. `.env` files are ignored on purpose, so your secrets stay private.

## Step 2: Database on Neon
1. Sign up at neon.com (no card needed) and create a project. Choose the region closest to Nigeria that is offered (usually Europe).
2. On the project dashboard open **Connect**, turn **off** "Connection pooling", and copy the connection string. It starts with `postgresql://` and ends with `?sslmode=require`.
3. On your computer, open `backend/.env` and temporarily replace `DATABASE_URL` with that string. Keep your old local line commented out with `#`. Also set `SEED_ADMIN_PASSWORD` to a strong password.
4. In the terminal:
   ```bash
   cd backend
   npx prisma migrate deploy
   npm run db:seed
   ```
   This creates the tables, your admin account and the demo products. (You can delete the demo products later from Admin > Products.)
5. Change `DATABASE_URL` in `.env` back to your local database.

## Step 3: Photo storage on Cloudinary
Create a free account at cloudinary.com. On its dashboard copy the **Cloud name**, **API key** and **API secret**. Keep the secret private.

## Step 4: Backend on Render
1. Sign up at render.com with GitHub. Choose **New > Web Service** and pick your repository.
2. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install --include=dev && npm run build`
   - **Start command:** `npm start`
   - **Instance type:** Free
   - **Health check path:** `/api/health`
3. Add these **environment variables**:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | the Neon string from Step 2 |
   | `JWT_SECRET` | a new long random string (run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
   | `FRONTEND_URL` | `https://YOUR-SITE.netlify.app` (fill in after Step 5) |
   | `SITE_URL` | the same Netlify address |
   | `PUBLIC_API_URL` | the same Netlify address |
   | `TRUST_PROXY` | `2` |
   | `PAYMENT_METHODS` | `WHATSAPP_CONFIRM` |
   | `STORAGE_DRIVER` | `cloudinary` |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from Step 3 |

   (Add the SMTP values later if you want password-reset and notification emails to be sent.)
4. Deploy. When it finishes, open `https://YOUR-BACKEND.onrender.com/api/health`. You should see `{"ok":true}`. Note your backend address.

## Step 5: Website on Netlify
1. In `frontend/public/_redirects`, replace both `YOUR-BACKEND` with your Render service name, then commit and push to GitHub.
2. Sign up at netlify.com with GitHub. **Add new site > Import an existing project** and pick the repository. The included `netlify.toml` fills in the build settings.
3. Under **Site configuration > Environment variables** add:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `same-origin` |
   | `VITE_USE_DEMO_FALLBACK` | `false` |
   | `VITE_SITE_URL` | `https://YOUR-SITE.netlify.app` |

4. Deploy. In **Site configuration > Change site name** pick a name you like. Your address is `https://that-name.netlify.app`.
5. Go back to Render and set `FRONTEND_URL`, `SITE_URL` and `PUBLIC_API_URL` to this exact address (no trailing slash). Render redeploys by itself.

## Step 6: Test everything
1. Open your Netlify address. The homepage should show products (wait a minute if the backend was asleep, then refresh).
2. Log in at `/login` with your admin email and password, then open `/admin`.
3. Add a product with a photo. Check it appears on the shop page with the photo.
4. In Admin > Settings confirm the WhatsApp number, and add your delivery fees.
5. Register a normal customer account in a private window, log out and in again (this proves cookies work), place a test order, and check it in Admin > Orders.
6. Send a test studio enquiry.

If login does not stay logged in, if you see "Too many attempts" errors, or if photo upload fails, tell me exactly what you see. Those are the three places this setup can need adjusting.

## Before you tell customers about it
- Delete the demo products (Admin > Products > Delete demo products) and add real ones.
- Fill in Admin > Settings: delivery and returns text, privacy policy, terms, About text.
- Keep your Neon connection string, Cloudinary secret and `JWT_SECRET` private. Never paste them into chat or GitHub.
- The temporary address is fine for friends and testing. For public marketing, buy a domain (docs/DEPLOYMENT.md) so you have a professional address and search engines treat it as yours.

## When you buy a domain later
1. Buy the domain and add it in Netlify (**Domain management**). Follow Netlify's DNS instructions at your registrar.
2. On Render change `FRONTEND_URL`, `SITE_URL` and `PUBLIC_API_URL` to the new address. Keep `TRUST_PROXY=2` as long as Netlify forwards `/api`.
3. In `frontend/public/robots.txt` replace `YOURDOMAIN.com`, push, and you are done. No code changes.
