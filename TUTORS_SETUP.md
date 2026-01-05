# Tutors Page Setup Instructions

## 📁 File Structure

```
data/tutors.ts          - Tutor profile data (names, descriptions, subjects, images)
components/TutorCard.tsx - Reusable tutor card component
app/tutors/page.tsx     - Tutors listing page
app/book/page.tsx       - Redirects to /book-now with tutor param
```

## 🖼️ Adding Tutor Images

1. **Location**: Place tutor photos in `/public/` folder
2. **Naming**: Use descriptive names like `lauren_chen_photo.jpg` or `tutor-name.jpg`
3. **Format**: JPG, PNG, or WebP
4. **Size**: Recommended 300x300px or larger (square aspect ratio works best)

**Example:**
```
/public/lauren_chen_photo.jpg
/public/john_smith.jpg
```

## ✏️ Adding/Editing Tutor Profiles

Edit `/data/tutors.ts`:

```typescript
{
  id: 'unique-id',                    // Internal ID (lowercase, hyphens)
  slug: 'unique-slug',                // URL-friendly identifier (same as id usually)
  name: 'Full Name',                  // Display name
  title: 'AP Chemistry, AP Lang',    // Optional subtitle
  description: 'Multi-sentence bio...', // Full description
  subjects: ['AP Chemistry', 'AP Lang'], // Array of subjects
  imageSrc: '/lauren_chen_photo.jpg',   // Path from /public folder
  isActive: true,                     // Set to false to hide
  sortOrder: 1                        // Lower numbers appear first
}
```

**To add a new tutor:**
1. Copy an existing tutor object
2. Update all fields
3. Add the image to `/public/`
4. Update `imageSrc` to match the filename
5. Adjust `sortOrder` to control display order

## 🔗 Booking Routing

**How it works:**
1. User clicks "Book with [Name]" on tutor card
2. Routes to `/book?tutor=lauren-chen`
3. `/book` page redirects to `/book-now?tutor=lauren-chen`
4. Booking page auto-selects the tutor if found

**Tutor matching:**
- The booking page tries to match the `tutor` query param to tutor IDs from the API
- If you need to map profile slugs to API tutor IDs, you may need to update the matching logic in `app/book-now/page.tsx`

## 📱 Responsive Layout

- **Mobile (< 640px)**: 1 column
- **Tablet (640px - 1024px)**: 2 columns  
- **Desktop (> 1024px)**: 3 columns

## 🎨 Styling

- Uses CSS Modules (`.module.css` files)
- Brand colors: Navy (#003B5C), Gold (#C69214)
- Cards have hover effects
- Fully accessible (semantic HTML, alt text, proper button labels)

## ✅ Current Tutors

- **Lauren Chen** - AP Chemistry, AP Language, AP Literature
  - Image: `/lauren_chen_photo.jpg`
  - Slug: `lauren-chen`

## 🔄 Connecting to Booking System

The booking page (`/book-now`) currently uses tutor IDs from the API (`/api/tutors`). If your profile tutors need to match API tutors:

1. Ensure the `id` or `slug` in `tutors.ts` matches the `id` in the API response
2. Or update the matching logic in `app/book-now/page.tsx` to map slugs to IDs

