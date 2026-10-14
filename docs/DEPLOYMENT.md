# Going live: domain, hosting, database, email

Order of work: (1) get the site working locally, (2) buy the domain, (3) deploy database, backend, frontend, (4) connect domain, (5) test, (6) switch on payments. Prices and free-tier limits change often, so check each provider's current pricing page before paying.

## 1. Buy a domain
A domain is the web address, such as `deyoungmusical.com`.

1. Pick a short, easy-to-spell name. Search for it at a registrar and compare the **renewal** price, not just the first-year price.
2. Options:
   - `.com`: works worldwide. Registrars include Namecheap, Porkbun and Cloudflare Registrar.
   - `.ng` / `.com.ng`: signals a Nigerian business. Buy from a registrar accredited for .ng (several Nigerian hosts such as Whogohost, Qservers and Truehost sell these; confirm on NiRA's site, https://nira.org.ng, that the registrar is accredited).
3. Pay with a card that works for international payments if you use a foreign registrar. Use your own account and email so you own the domain.
4. Turn on **auto-renew** and **registrar lock**, and use a strong password plus two-factor sign-in on the registrar account. Losing the domain means losing the shop.

## 2. Database (PostgreSQL)
Use Neon or Supabase (or your host's own Postgres).
1. Create a project and a database, region as close to Nigerian customers as available (Europe is often closer than the US).
2. Copy the connection string. This becomes `DATABASE_URL` on the backend host.
3. Create the tables on the live database once, from your computer:
   ```bash
   cd backend
   DATABASE_URL="your-live-string" npx prisma migrate deploy
   ```
   Do NOT run the demo seed on live unless you want demo products. Create the admin account with the seed script once, then delete the demo products in the dashboard.
4. Turn on automatic backups (a paid-plan feature on some providers) or schedule `pg_dump` exports.

## 3. Backend (API) hosting: Render or Railway
1. Push the project to a private GitHub repo.
2. Create a new **Web Service** from the repo. Settings:
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
3. Add environment variables: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` (a new long random value, not the local one), `FRONTEND_URL=https://www.yourdomain.com`.
4. Deploy, then open `https://<your-service>.onrender.com/api/health`. You should see `{"ok":true}`.
5. Free plans may "sleep" when idle, which makes the first visit slow. Use a paid plan for a real shop.

## 3b. Product photo storage (Stage 7)
Most backend hosts erase files saved on their disk whenever the service restarts, which would delete your product photos. Use Cloudinary instead:
1. Create a free account at https://cloudinary.com (check their current free limits).
2. On the dashboard copy the **Cloud name**, **API key** and **API secret**.
3. On the backend host set `STORAGE_DRIVER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Keep the API secret private, backend only.
4. Also set `PUBLIC_API_URL=https://api.yourdomain.com`.

## 4. Frontend hosting: Vercel, Netlify or Cloudflare Pages
(Available after Stage 2.)
1. Import the same GitHub repo. Root directory: `frontend`. Build command: `npm run build`. Output: `dist`.
2. Add the variable `VITE_API_URL=https://api.yourdomain.com`.
3. Deploy. You get a temporary `*.vercel.app` address to test.

## 5. Connect your domain
**Important for customer logins (Stage 6):** use `www.yourdomain.com` for the website and `api.yourdomain.com` for the backend. Logins are stored in a cookie that browsers only send between addresses on the same main domain. Also set `VITE_API_URL=https://api.yourdomain.com` and the backend `FRONTEND_URL=https://www.yourdomain.com`. For password-reset emails, set the `SMTP_*` variables on the backend.

In your registrar's DNS settings add the records your hosts tell you to (the exact values appear in each host's "Domains" screen):
- `www` CNAME to the frontend host.
- Root domain (`yourdomain.com`) A or ALIAS record to the frontend host, or redirect it to `www`.
- `api` CNAME to the backend host.
Then add the domains inside Vercel (frontend) and Render (backend). HTTPS certificates are issued automatically. DNS changes can take from minutes to a day.
Finally set the backend `FRONTEND_URL` to `https://www.yourdomain.com` so the browser is allowed to call the API.

## 6. Business email
Use a mailbox on your domain (for example `info@yourdomain.com`) through Zoho Mail or Google Workspace. Follow their MX-record instructions. Customers trust this more than a Gmail address.

## 7. Payments (Stage 5)
- Open a Paystack or Flutterwave business account. They ask for identity and often business documents (CAC registration), and approval takes time, so start early.
- Test with their **test keys** first. Only switch to **live keys** after a full test order.
- Put keys only in backend environment variables.

## 8. Go-live checklist
- [ ] Demo products deleted, real products and photos uploaded
- [ ] Real delivery fees, returns and warranty text added
- [ ] Business address and opening hours added (or removed)
- [ ] Admin password strong and different from local
- [ ] Test order placed and paid with test keys, then with a small live payment
- [ ] Privacy policy and terms pages written
- [ ] Database backups on
- [ ] Domain auto-renew on
