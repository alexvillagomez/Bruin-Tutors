/**
 * SEO utility functions for generating metadata and structured data
 */

export function slugifySubject(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/ap\s+/g, 'ap-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function subjectFromSlug(slug: string): string {
  // Handle special case: ap-* subjects
  if (slug.startsWith('ap-')) {
    const rest = slug.replace('ap-', '')
    const formatted = rest
      .split('-')
      .map(word => {
        // Handle special abbreviations that should be all uppercase
        const upperWords = ['ab', 'bc', 'c']
        if (upperWords.includes(word.toLowerCase())) {
          return word.toUpperCase()
        }
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')
    return `AP ${formatted}`
  }
  
  // Regular formatting
  return slug
    .split('-')
    .map(word => {
      const upperWords = ['ab', 'bc', 'c']
      if (upperWords.includes(word.toLowerCase())) {
        return word.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .replace(/Ap /g, 'AP ')
}

export function generateSubjectPageTitle(subject: string): string {
  return `${subject} Tutor | Online AP Tutoring | Bruin Tutors`
}

export function generateSubjectPageDescription(subject: string, tutorCount: number): string {
  return `Find expert ${subject} tutors at Bruin Tutors. Our UCLA student tutors specialize in ${subject} and offer online one-on-one sessions. Book your ${subject} tutoring session today.`
}

export function generateLocationPageTitle(location: string): string {
  return `${location} Tutors | Online AP Tutoring | Bruin Tutors`
}

export function generateLocationPageDescription(location: string): string {
  return `Find expert AP tutors in ${location} at Bruin Tutors. Our UCLA student tutors offer online one-on-one tutoring sessions. Book your tutoring session today.`
}

