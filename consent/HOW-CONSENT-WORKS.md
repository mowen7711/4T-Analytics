# How Cookie Consent Works

This document explains exactly how the 4T Technologies website checks for your consent **before** collecting any analytics data. The source code it refers to lives in [`CookieConsent.tsx`](./CookieConsent.tsx) in this repository.

---

## Consent is stored in your browser, not our servers

When you make a choice on the cookie banner, it is stored in `localStorage` — a small key-value store that lives only in your browser. The key is `cookie_consent` and the value is one of three states:

| Value | Meaning |
|-------|---------|
| *(not set)* | You have not made a choice yet — nothing is collected |
| `"accepted"` | You clicked Accept — analytics are active |
| `"declined"` | You clicked Decline — nothing is ever collected |

**Nothing is written to this key until you click a button.** Until then, every tracking function sees `"pending"` and exits immediately.

---

## The consent banner

The banner appears 1 second after your first visit (the delay avoids flashing on fast connections where you may navigate away instantly).

```typescript
// CookieConsent.tsx — line 27-33
useEffect(() => {
  const current = getCookieConsent();
  setStatus(current);
  if (current === "pending") {
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }
}, []);
```

### Accept
```typescript
// CookieConsent.tsx — lines 35-41
const handleAccept = () => {
  localStorage.setItem("cookie_consent", "accepted");
  const id = crypto.randomUUID();          // random UUID — no personal data used
  localStorage.setItem("visitor_id", id);
  setStatus("accepted");
  setVisible(false);
};
```
- Writes `cookie_consent = "accepted"` to localStorage
- Generates a random UUID as a visitor ID (no name, email, or device fingerprint used)
- Hides the banner

### Decline
```typescript
// CookieConsent.tsx — lines 43-48
const handleDecline = () => {
  localStorage.setItem("cookie_consent", "declined");
  localStorage.removeItem("visitor_id");   // deletes any existing ID
  setStatus("declined");
  setVisible(false);
};
```
- Writes `cookie_consent = "declined"` to localStorage
- Deletes the visitor ID if one existed
- Hides the banner — no data is ever collected after this

---

## The two consent helper functions

Both are exported from `CookieConsent.tsx` and imported into every tracking hook.

### `getCookieConsent()`
```typescript
export function getCookieConsent(): ConsentStatus {
  const stored = localStorage.getItem("cookie_consent");
  if (stored === "accepted" || stored === "declined") return stored;
  return "pending";
}
```
Reads the localStorage key and returns a typed value. Used as the first guard in every tracking call.

### `getVisitorId()`
```typescript
export function getVisitorId(): string | null {
  if (getCookieConsent() \!== "accepted") return null;  // hard gate
  let id = localStorage.getItem("visitor_id");
  if (\!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitor_id", id);
  }
  return id;
}
```
Returns `null` immediately if consent is not accepted. This is a **second independent layer of protection** — even if a direct consent check were accidentally omitted somewhere in the code, `getVisitorId()` would still return `null` and the tracking call would abort.

---

## How every tracking call is protected

There are three distinct guard patterns used across the codebase:

### Pattern 1 — Direct consent check (used for Web Vitals, JS errors, page views)
```typescript
if (getCookieConsent() \!== "accepted") return;
```
This appears at the top of:
- Web Vitals setup (`onLCP`, `onFCP`, `onCLS`, `onINP`, `onTTFB`)
- JavaScript error tracking (`window.onerror`, `unhandledrejection`)
- Page view tracking (the `fetch` to `/api/track`)
- Engagement beacon (scroll depth + time on page sent on tab hide)

### Pattern 2 — Visitor ID null check (implicit consent gate)
```typescript
const visitorId = getVisitorId();
if (\!visitorId) return;
```
Because `getVisitorId()` returns `null` when consent is not accepted, any call that checks `\!visitorId` is also inherently checking consent — a second layer even where Pattern 1 is not present.

### Pattern 3 — Cart event double-check
```typescript
const consent = localStorage.getItem("cookie_consent");
const visitorId = localStorage.getItem("visitor_id");
if (consent \!== "accepted" || \!visitorId) return;
```
Cart events (`add_to_cart`, `remove_from_cart`) check **both** the consent flag and the presence of a visitor ID before firing. Both conditions must be true.

---

## Admin pages are always excluded

Even with consent accepted, the admin area is never tracked:
```typescript
if (location.startsWith("/admin")) return;
```
This check runs before any data is assembled or sent.

---

## Server-side verification

The client sends `cookieConsent: getCookieConsent()` in the body of every `/api/track` request. The server reads this field independently and will **not** write an IP address (even the anonymised version) unless the payload contains `cookieConsent === "accepted"`. This means consent is enforced at two independent points: the client and the server.

---

## Changing your mind

To withdraw consent at any time:
1. Open your browser developer tools → Application → Local Storage → your site origin
2. Delete the `cookie_consent` and `visitor_id` keys
3. Refresh the page — the banner will reappear and no data will be collected until you accept again

Or clear all site data in your browser settings. Once cleared, the site has no record that you ever visited.

---

## Summary of protections

| Protection | Where |
|-----------|-------|
| Consent banner blocks all tracking until a choice is made | `CookieConsent.tsx` |
| `getCookieConsent() \!== "accepted"` guard at top of every tracking effect | `useVisitorTracking.ts` |
| `getVisitorId()` returns `null` if consent not accepted | `CookieConsent.tsx` |
| Cart events check consent AND visitor_id presence | `useCart.ts` |
| Admin pages always excluded | `useVisitorTracking.ts` |
| Server re-checks consent before writing IP | `server/routes.ts` |
| Declining removes visitor ID from localStorage | `CookieConsent.tsx` |
