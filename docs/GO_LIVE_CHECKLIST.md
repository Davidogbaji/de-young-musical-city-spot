# Go-live checklist

Tick each box before you tell customers about the shop.

## Content
- [ ] Demo products deleted (Admin > Products > Delete demo products) and real products added
- [ ] Every product has photos of the exact item, a real price, the right stock and a category (add a brand only if you really sell it)
- [ ] Admin > Settings filled in: WhatsApp number, phone, email, address (or left blank), opening hours
- [ ] Delivery fees set for the states you deliver to (Admin > Delivery fees). Unset states show "to be confirmed"
- [ ] Delivery and returns, privacy policy, terms and About text written (Admin > Settings). Only promise what you will honour
- [ ] Banners and testimonials added only if they are real. Testimonials only with the customer's permission

## Security
- [ ] Admin password is strong and used nowhere else. Staff each have their own account
- [ ] `JWT_SECRET` on the live backend is a new long random value, not the local one
- [ ] No `.env` file or secret ever uploaded to GitHub (check the repository once)
- [ ] `VITE_USE_DEMO_FALLBACK=false` on the live website
- [ ] Database backups switched on or a regular export planned (Neon: check restore options on your plan)
- [ ] Neon, Render, Netlify, Cloudinary and GitHub accounts have two-step sign-in turned on

## Test the full customer journey on the live address (phone and laptop)
- [ ] Browse, search, filter and open a product
- [ ] Add to cart, change quantity, place an order as a guest (WhatsApp payment)
- [ ] Order appears in Admin > Orders; "Message customer on WhatsApp" opens the right number
- [ ] Mark the test order as paid, then cancel another test order and confirm stock returns
- [ ] Register, log out, log in, reset password (needs SMTP), save an address, use the wishlist
- [ ] Studio enquiry arrives in Admin > Studio enquiries
- [ ] Upload a product photo and confirm the whole picture shows on the card and product page
- [ ] Newsletter sign-up works and the unsubscribe link works

## Running the shop day to day
- Check **Admin > Orders** and **Studio enquiries** at least daily. There is no automatic alert unless SMTP email is set up
- Orders reserve stock as soon as they are placed. Cancel orders that are never paid so the items go back on sale
- Mark an order as paid only after the money has actually arrived
- Update stock when you sell items in the physical shop, so the website does not oversell

## Known limits of this version
- Customers pay through WhatsApp; there is no card payment (it can be added later)
- No automatic email to customers about order status changes
- No "best sellers" section, because sales ranking is not tracked and numbers are never invented
- Guest orders are not linked to accounts by matching email (emails are not verified yet)
- The website is a single-page app. Google can read it, but a pre-rendered version could help search ranking later
- On Render's free plan the backend sleeps when idle (see docs/FREE_HOSTING.md)
