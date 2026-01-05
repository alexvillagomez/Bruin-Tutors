import { MetadataRoute } from 'next'
import { getPublicTutors } from '@/lib/tutors'
import { slugifySubject } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bruintutors.com'
  
  const tutors = getPublicTutors()
  const subjectsSet = new Set<string>()
  tutors.forEach(tutor => {
    tutor.subjects.forEach(subject => subjectsSet.add(subject))
  })
  
  const subjectPages = Array.from(subjectsSet).map(subject => ({
    url: `${baseUrl}/${slugifySubject(subject)}-tutors`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/tutors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tutors-in-los-angeles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/book-now`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...subjectPages,
  ]
}

