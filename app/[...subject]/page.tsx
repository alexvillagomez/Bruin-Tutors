import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TutorCard from '@/components/TutorCard'
import StructuredData from '@/components/StructuredData'
import { getPublicTutors } from '@/lib/tutors'
import { slugifySubject, subjectFromSlug, generateSubjectPageTitle, generateSubjectPageDescription } from '@/lib/seo'
import styles from '../tutors/page.module.css'

// Generate static paths for all subjects
export async function generateStaticParams() {
  const tutors = getPublicTutors()
  const subjectsSet = new Set<string>()
  
  tutors.forEach(tutor => {
    tutor.subjects.forEach(subject => subjectsSet.add(subject))
  })
  
  return Array.from(subjectsSet).map(subject => ({
    subject: [`${slugifySubject(subject)}-tutors`] // Returns ['ap-calculus-bc-tutors']
  }))
}

// Generate metadata for each subject page
export async function generateMetadata({ params }: { params: { subject: string[] } }): Promise<Metadata> {
  // Handle URL like /ap-calculus-bc-tutors -> params.subject = ['ap-calculus-bc-tutors']
  if (params.subject.length !== 1 || !params.subject[0].endsWith('-tutors')) {
    return {
      title: 'Page Not Found | Bruin Tutors',
    }
  }
  
  // Extract subject slug by removing '-tutors' suffix
  const fullSlug = params.subject[0]
  const subjectSlug = fullSlug.replace(/-tutors$/, '')
  const subject = subjectFromSlug(subjectSlug)
  const tutors = getPublicTutors()
  const subjectTutors = tutors.filter(tutor => tutor.subjects.includes(subject))
  
  if (subjectTutors.length === 0) {
    return {
      title: 'Subject Not Found | Bruin Tutors',
    }
  }
  
  const urlPath = `/${subjectSlug}-tutors`
  
  return {
    title: generateSubjectPageTitle(subject),
    description: generateSubjectPageDescription(subject, subjectTutors.length),
    openGraph: {
      title: generateSubjectPageTitle(subject),
      description: generateSubjectPageDescription(subject, subjectTutors.length),
      type: 'website',
    },
    alternates: {
      canonical: urlPath,
    },
  }
}

export default function SubjectTutorsPage({ params }: { params: { subject: string[] } }) {
  // Handle URL like /ap-calculus-bc-tutors -> params.subject = ['ap-calculus-bc-tutors']
  if (params.subject.length !== 1 || !params.subject[0].endsWith('-tutors')) {
    notFound()
  }
  
  // Extract subject slug by removing '-tutors' suffix
  const fullSlug = params.subject[0]
  const subjectSlug = fullSlug.replace(/-tutors$/, '')
  const subject = subjectFromSlug(subjectSlug)
  const tutors = getPublicTutors()
  const subjectTutors = tutors.filter(tutor => tutor.subjects.includes(subject))
  
  if (subjectTutors.length === 0) {
    notFound()
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bruintutors.com'
  
  // Get all subjects for filter buttons
  const allSubjects = Array.from(new Set(
    tutors.flatMap(tutor => tutor.subjects)
  )).sort()
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${subject} Tutors`,
    description: `Expert ${subject} tutors available for online tutoring sessions`,
    itemListElement: subjectTutors.map((tutor, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Person',
        name: tutor.displayName,
        description: tutor.blurb,
        url: `${baseUrl}/book-now?tutor=${tutor.id}`,
      },
    })),
  }
  
  return (
    <>
      <StructuredData data={structuredData} />
      <main className={styles.main}>
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.header}>
              <h1 className={styles.title}>{subject} Tutors</h1>
              <p className={styles.subtitle}>
                Expert {subject} tutoring from UCLA students. Book your one-on-one session today.
              </p>
            </div>

            {/* Subject Filter */}
            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Filter by Subject:</label>
              <div className={styles.filterButtons}>
                <Link href="/tutors" className={styles.filterButton}>
                  All
                </Link>
                {allSubjects.map(subj => (
                  <Link
                    key={subj}
                    href={`/${slugifySubject(subj)}-tutors`}
                    className={`${styles.filterButton} ${subj === subject ? styles.filterButtonActive : ''}`}
                  >
                    {subj}
                  </Link>
                ))}
              </div>
            </div>

            <div className={styles.grid}>
              {subjectTutors.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  id={tutor.id}
                  name={tutor.displayName}
                  description={tutor.blurb}
                  subjects={tutor.subjects}
                  photoUrl={tutor.photoUrl}
                />
              ))}
            </div>
            
            <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#003B5C' }}>
                Why Choose Bruin Tutors for {subject}?
              </h2>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8', color: '#555' }}>
                <li>UCLA students who have excelled in {subject}</li>
                <li>One-on-one personalized tutoring sessions</li>
                <li>Flexible online scheduling</li>
                <li>Proven track record of helping students succeed</li>
                <li>Affordable rates with transparent pricing</li>
              </ul>
              <div style={{ marginTop: '1.5rem' }}>
                <a 
                  href="/book-now" 
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#003B5C',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                  }}
                >
                  Book a {subject} Session
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

