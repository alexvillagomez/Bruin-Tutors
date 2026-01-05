import { Tutor, TutorPublic } from './types'
import tutorsData from '../data/tutors.json'

export function getAllTutors(): Tutor[] {
  return tutorsData as Tutor[]
}

export function getTutorById(id: string): Tutor | undefined {
  return getAllTutors().find(tutor => tutor.id === id)
}

export function getActiveTutors(): Tutor[] {
  return getAllTutors()
    .filter(tutor => tutor.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getPublicTutors(): TutorPublic[] {
  return getActiveTutors().map(tutor => ({
    id: tutor.id,
    displayName: tutor.displayName,
    subjects: tutor.subjects,
    blurb: tutor.blurb,
    bookingBlurb: tutor.bookingBlurb,
    photoUrl: tutor.photoUrl,
    baseRateCents: tutor.baseRateCents,
    calendarConnected: tutor.calendarConnected
  }))
}

export function getTutorBySlug(slug: string): Tutor | undefined {
  return getAllTutors().find(tutor => tutor.id === slug)
}

