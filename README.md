# De Young Musical and City Spot: E-commerce Project

Built in stages. Each stage runs on its own before the next one starts.

| Stage | What | Status |
|---|---|---|
| 1 | Backend foundation: database schema, products API, seed data, tests | Done (this download) |
| 2 | Frontend (React + Vite + Tailwind): homepage, header, WhatsApp widget, cart | Done |
| 3 | Shop page (filters, sorting, pagination) and product detail page | Done |
| 4 | Checkout and orders (server-side pricing, stock-safe) | Done |
| 5 | Online card payments (Paystack/Flutterwave) | Skipped by choice. Customers pay through WhatsApp. Can be added any time later |
| 6 | Accounts: register, login, password reset, saved addresses, wishlist, order history | Done |
| 7 | Admin dashboard: products, photos, stock, orders, delivery fees | Done |
| 8 | Studio enquiries, testimonials, newsletter, editable business details, SEO | Done |
| 9 | Review and go-live: docs/GO_LIVE_CHECKLIST.md. Deployment. **Free hosting now:** docs/FREE_HOSTING.md. Domain later: docs/DEPLOYMENT.md | Guides ready |

`docs/homepage-prototype.html` is the single-file homepage prototype. Open it in a browser to see the target look. Stage 2 rebuilds it in React.

## Part 1: Set up your computer (once)

1. **Node.js 20 or newer (LTS)**: https://nodejs.org. Check with `node -v`.
2. **Git**: https://git-scm.com. Check with `git --version`.
3. **VS Code**: https://code.visualstudio.com
4. VS Code extensions (Extensions icon, search by name): *Prisma*, *ESLint*, *Prettier*, *Tailwind CSS IntelliSense*, *Thunder Client* (to test the API).
5. **A PostgreSQL database.** Pick ONE:
   - **Easiest (hosted, free tier):** create a project at https://neon.tech or https://supabase.com and copy the connection string. Free-tier limits change, so check their pricing pages.
   - **Local:** install PostgreSQL from https://www.postgresql.org/download/, create a database named `deyoung`.

## Part 2: Run the backend

Open the `de-young-musical-city-spot` folder in VS Code (File > Open Folder), then open the terminal (Terminal > New Terminal):

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Edit `backend/.env`:
- `DATABASE_URL`: your Postgres connection string.
- `JWT_SECRET`: run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste the result.
- `SEED_ADMIN_PASSWORD`: choose a strong password for the first admin login.

Then:

```bash
npx prisma migrate dev --name init   # creates all tables
npm run db:seed                       # categories, brands, 12 DEMO products, admin user
npm run dev                           # API on http://localhost:4000
npm test                              # runs the tests
```

Try in the browser: http://localhost:4000/api/health, then http://localhost:4000/api/products

### API in this stage

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Is the server up |
| `GET /api/products` | List. Query: `q, category, brand, minPrice, maxPrice, inStock=true, sort=newest\|price_asc\|price_desc\|name, page, limit` |
| `GET /api/products/:idOrSlug` | One product plus related products |
| `GET /api/search?q=guitar` | Same as products with search |
| `GET /api/categories`, `GET /api/brands` | Lists |

Errors always look like `{ "error": { "message": "...", "details": {...} } }`.

Products marked `isDemo: true` are demonstration data with made-up prices. Delete or edit them once the admin dashboard exists (Stage 7).

## Part 3: Save your work with Git and GitHub

```bash
git init && git add . && git commit -m "Stage 1: backend foundation"
```
Create an empty repository on https://github.com (private), then follow the "push an existing repository" commands it shows. `.env` is already git-ignored, so your secrets stay on your computer.

## Part 4: Run the frontend (Stage 2)

Keep the backend running in one terminal. Open a second terminal (Terminal > New Terminal):

```bash
cd frontend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
npm run dev                 # http://localhost:5173
```

`frontend/.env` holds only public values: `VITE_API_URL` (backend address), `VITE_WHATSAPP_NUMBER` (08100090843) and `VITE_USE_DEMO_FALLBACK`.
If the backend is off and the fallback is `true`, the homepage shows labelled demonstration products so it never looks empty. Set it to `false` before going live.

Build check: `npm run build` (type-checks, then creates `dist/`).

Stage 3 adds `/shop` (search, category, brand, price, in-stock filters, sorting, pagination; every filter lives in the URL so pages can be shared) and `/product/:slug` (gallery, quantity, Add to Cart, Buy Now, WhatsApp enquiry, specifications, related products, structured data for search engines). The Wishlist button is disabled until accounts exist (Stage 6).

### Checkout and orders (Stage 4)

- `/checkout` collects name, email, phone, delivery address (or store pickup), state, city, notes and a payment option, with a live order summary.
- The browser sends only product IDs and quantities. The **server** looks up prices, applies discounts, adds the delivery fee and calculates the total.
- Stock is taken inside one database transaction, so two customers cannot both buy the last unit and a failed order takes no stock.
- Orders start as `PENDING` and **never** as paid. Payment options come from `PAYMENT_METHODS` in `backend/.env` (`WHATSAPP_CONFIRM`, `BANK_TRANSFER`, `PAY_ON_DELIVERY`). Online card payment arrives in Stage 5.
- **Delivery fees:** none are invented. Until you add fees, the page says "To be confirmed". To add them now: `cd backend && npm run db:studio`, open the `DeliveryZone` table and add rows such as state `Lagos`, fee `5000` (your real fees). The admin dashboard will do this in Stage 7.
- **Viewing orders before the admin dashboard:** `npm run db:studio` and open the `Order` table. Customers are asked to message you on WhatsApp after ordering, so you hear about each order.
- Order pages (`/order/DY-...`) need the reference AND the email used, so strangers cannot read orders.
- A cancelled order does not return its stock automatically yet. Edit the product stock by hand until Stage 7.

New endpoints: `GET /api/checkout/config`, `POST /api/orders`, `GET /api/orders/:reference?email=`.

### Customer accounts (Stage 6): update steps

Stage 6 adds packages and one database column, so after copying the new files run:

```bash
cd backend
npm install
npx prisma migrate dev --name accounts
npm test
```
Then restart `npm run dev` in both folders.

- **Pages:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account` (orders, profile, addresses, password) and `/wishlist`. Hearts on product cards and product pages save to the wishlist; guests are sent to log in first and returned afterwards.
- **Security:** passwords are hashed with bcrypt. The login is an HttpOnly cookie (JavaScript cannot read it). Resetting or changing a password logs out every other device. Login and reset requests are rate-limited. Requests from other websites are refused (CSRF protection).
- **Password reset email:** in development the reset link is **printed in the backend terminal**. For a live site fill in the `SMTP_*` values in `backend/.env` (your business mailbox's SMTP details) or reset emails will not be sent.
- **Orders and accounts:** orders placed while logged in appear in the customer's history. Guest orders are deliberately NOT linked to an account by matching email, because emails are not verified yet.
- **Admin login:** the admin account made by `npm run db:seed` can already log in. Admin tools arrive in Stage 7.
- **Going live:** the login cookie only works when the website and API share the same main domain, such as `www.yourdomain.com` and `api.yourdomain.com`. Set this up as described in `docs/DEPLOYMENT.md` before testing logins on the live site. The temporary `*.vercel.app` and `*.onrender.com` addresses will not keep customers logged in.

### Admin dashboard (Stage 7): update steps

No database change this time, only new packages:

```bash
cd backend
npm install
npm test
```
Restart both servers, then open **http://localhost:5173/admin**.

**Getting your admin login.** Put a strong `SEED_ADMIN_PASSWORD` in `backend/.env` (the email is already `SEED_ADMIN_EMAIL`), then run `npm run db:seed` once. It creates the admin account (it will not overwrite an existing one). Log in at `/login` and open `/admin`.

**Roles.** `ADMIN` can do everything. `STAFF` can manage products, stock, photos and orders but cannot delete products or change categories, brands or delivery fees. To make an employee STAFF: they register normally, then you open `npm run db:studio`, find them in `User` and change `role` to `STAFF`. Every rule is enforced on the server, so hiding a button is never the only protection.

**What the dashboard does**
- **Dashboard:** orders waiting for action, orders and money received in the last 30 days, low-stock list, recent orders.
- **Products:** add, edit and delete; price, discount price, stock, status (Active/Draft/Archived), featured, specifications, warranty, several photos (first one is the main photo). Edit stock right in the list. "Delete demo products" clears all demonstration items in one click when you are ready to go live.
- **Orders:** search and filter, see customer contact details, message the customer on WhatsApp, **Mark as paid** (only after you receive the money; it records a payment), change status, and **export to CSV** for Excel. Cancelling an order puts its items back in stock automatically, once.
- **Categories and brands:** add, rename, add category photos, delete (blocked while products still use them).
- **Delivery fees:** a fee for each state. Blank means "to be confirmed" at checkout.

**Product photos.** Files are checked by their real contents (JPEG, PNG or WebP, up to 5 MB) and renamed by the server. `STORAGE_DRIVER=local` saves them in `backend/uploads` (good for your computer). On hosts that erase files on restart, use `STORAGE_DRIVER=cloudinary` (see `docs/DEPLOYMENT.md`).

**Not in the dashboard yet** (Stage 8): studio enquiries inbox, testimonials, promotional banners and editing business contact details. Until Stage 8, the WhatsApp number and email are set in `frontend/.env` and `backend/.env`.

Pages not yet built show a "Stage N" placeholder until their stage is built. The cart, the "Send order on WhatsApp" button, the WhatsApp widget and product enquiries already work.

### Studio, content and SEO (Stage 8): update steps

No database change and no new packages:

```bash
cd backend && npm test
```
Restart both servers.

- **Studio setup page** (`/studio-setup`): seven service types, suggested equipment links, Request a Quote and WhatsApp buttons, and the enquiry form. The success message appears only after the server has saved the enquiry. A hidden trap field quietly rejects spam bots. New enquiries land in **Admin > Studio enquiries** (call, WhatsApp or email the customer, and track NEW, CONTACTED, QUOTED, CLOSED). If SMTP is set up, the shop email also gets a notification.
- **Admin > Settings:** WhatsApp number, phone, email, address, opening hours, social links, delivery and warranty summaries, About text and the three policy pages. Changes appear on the live site within a minute. The WhatsApp number entered here replaces the one in `frontend/.env`.
- **Admin > Banners and testimonials:** promotional banners show under the homepage hero. Testimonials appear on the homepage only after you add them and tick Published. Nothing is invented: with none published, the section is hidden.
- **Newsletter:** the footer form needs a ticked consent box. Subscribers get a welcome email with an unsubscribe link (needs SMTP). **Admin > Newsletter** lists subscribers and exports them to CSV.
- **SEO:** each page sets its own title, description, sharing tags and canonical address. The backend serves `/sitemap.xml` (products, categories and main pages; demo products are left out). `frontend/public/robots.txt` hides the admin, account and checkout pages. Replace `YOURDOMAIN.com` in `robots.txt` when you have a domain. The site is a single-page app, so search engines render it with JavaScript. That works for Google, but a server-rendered version could be added later if rankings matter.

### Final polish
- **Whole photos:** every uploaded picture is shown in full (never cropped) on product cards, product pages, category cards, banners and admin lists.
- **Featured products:** the homepage shows products ticked "Featured" first (newest if none are).
- **Shop by brand:** the homepage lists only brands that currently have products.

## Not yet done
Nothing is live yet until you follow docs/FREE_HOSTING.md. Online card payment is intentionally skipped (customers pay through WhatsApp).
