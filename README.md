# Bruin-Tutors

A tutoring service for UCLA students that I built and run. Students can browse tutors, book sessions against real availability, and pay for them, and the whole thing runs end to end without me coordinating anything by hand.

**Live site:** [bruin-tutors.vercel.app](https://bruin-tutors.vercel.app)

## What it does

- Students browse tutors and book sessions against live availability.
- Booking is backed by Google Calendar, so scheduling stays in sync with real calendars and there are no double-bookings.
- Sign-in runs through NextAuth and payments go through Stripe.
- Confirmation emails are sent automatically with nodemailer.

## Stack

- Next.js and TypeScript
- Prisma for the database layer
- NextAuth for authentication
- Google Calendar API for availability and scheduling
- Stripe for payments
- Deployed on Vercel

## Notes

This started as a real need: I was tutoring UCLA students and wanted to stop managing scheduling and payments manually. So I built the whole flow, from browsing a tutor to a confirmed, paid, calendar-synced session, as one automated system.
