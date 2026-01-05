# Tutors Data File

## Adding New Tutors

When adding a new tutor to `tutors.json`, include the following fields:

- `id`: Unique identifier (slug format, e.g., "john-doe")
- `displayName`: Full name to display
- `subjects`: Array of subjects they tutor
- `blurb`: **Long description** for the "Meet the Tutors" page (full bio)
- `bookingBlurb`: **Short description** for the booking page (1-2 sentences)
- `calendarConnected`: Boolean indicating if Google Calendar is set up
- `isActive`: Boolean to show/hide tutor
- `sortOrder`: Number for display order

### Important Notes

- **`blurb`**: Full description shown on `/tutors` page
- **`bookingBlurb`**: Short descriptionking page will use a fallback (first 120 chars of `blurb` or default message)
- Always add `bookingBlurb` for new tutors to keep the booking page clean

 shown on `/book-now` page
- If `bookingBlurb` is missing, the boo