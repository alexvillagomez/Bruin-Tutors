# Implementation Summary: Single Source of Truth & Contact Form

## Files Changed

### 1. Single Source of Truth for Tutors
**Files Modified:**
- `data/tutors.json` - Added `photoUrl` field to tutor data
- `lib/types.ts` - Added `photoUrl?: string | null` to `Tutor` and `TutorPublic` types
- `lib/tutors.ts` - Updated `getPublicTutors()` to include `photoUrl`
- `app/tutors/page.tsx` - Updated to use `/api/tutors` (single source) instead of `data/tutors.ts`
- `components/TutorCard.tsx` - Updated to:
  - Accept `photoUrl` instead of `imageSrc`
  - Handle missing photos with placeholder (shows first letter of name)
  - Make entire card clickable, navigates to `/book-now?tutor={id}`
- `data/tutors.ts` - **DELETED** (duplicate source removed)

**Result:** All tutor data now comes from `data/tutors.json` via `lib/tutors.ts` and `/api/tutors` route.

### 2. Tutor Card Navigation
**Files Modified:**
- `components/TutorCard.tsx` - Wrapped entire card in `<Link>` to `/book-now?tutor={id}`
- `components/TutorCard.module.css` - Added `.cardLink` styles for proper link behavior

**Result:** Clicking any tutor card on the Tutors page navigates to that tutor's booking page.

### 3. Missing Photo Handling
**Files Modified:**
- `components/TutorCard.tsx` - Conditional rendering: shows Image if `photoUrl` exists, otherwise shows placeholder
- `components/TutorCard.module.css` - Added `.placeholderImage` and `.placeholderText` styles

**Result:** Tutors without photos show a clean placeholder with their initial instead of broken images.

### 4. Contact Form Implementation
**Files Created:**
- `app/api/contact/route.ts` - New API route for contact form submissions

**Files Modified:**
- `app/contact/page.tsx` - Converted to client component with form state and submission handling
- `app/contact/page.module.css` - Added styles for success/error messages, required indicators, helper text

**Features:**
- Server-side validation
- Honeypot spam protection (hidden `website` field)
- Email sending via Resend API (or console log if not configured)
- Success/error message display
- Loading states
- Preferred contact method tracking

### 5. Environment Variables
**Files Created:**
- `.env.example` - Template for required environment variables

**New Variables:**
- `RESEND_API_KEY` - API key from Resend.com
- `RESEND_FROM_EMAIL` - Sender email address (e.g., "Bruin Tutors <noreply@bruintutors.com>")
- `CONTACT_EMAIL` - Recipient email (defaults to alexvillagomeztutoring@gmail.com)

## Setup Instructions

### 1. Email Service Setup (Resend)
1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=Bruin Tutors <noreply@yourdomain.com>
   CONTACT_EMAIL=alexvillagomeztutoring@gmail.com
   ```

**Note:** If `RESEND_API_KEY` is not set, the contact form will still work but emails will only be logged to the console (for development).

### 2. Verify Tutor Data
- All tutors are in `data/tutors.json`
- Add `photoUrl` field for tutors with photos (or leave as `null` for placeholder)
- Both Tutors page and Book Now page use the same data source

## Testing Checklist

- [ ] Tutors page shows all tutors from `data/tutors.json`
- [ ] Clicking a tutor card navigates to `/book-now?tutor={id}`
- [ ] Book Now page shows the same tutors in the same order
- [ ] Tutors without photos show placeholder (first letter) instead of broken image
- [ ] Contact form submits successfully
- [ ] Contact form sends email (check inbox)
- [ ] Contact form shows success message after submission
- [ ] Contact form shows error message on failure
- [ ] Honeypot field prevents spam (test by filling it)

## Notes

- The contact form uses Resend API directly via fetch (no package needed)
- If Resend is not configured, emails are logged to console for development
- Tutor photos should be added to `/public` folder and referenced in `data/tutors.json`
- All tutor data flows through `lib/tutors.ts` → `/api/tutors` → frontend components

