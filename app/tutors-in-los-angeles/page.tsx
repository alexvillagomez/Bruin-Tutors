import { Metadata } from 'next'
import TutorCard from '@/components/TutorCard'
import { getPublicTutors } from '@/lib/tutors'
import { generateLocationPageTitle, generateLocationPageDescription } from '@/lib/seo'
import styles from '../tutors/page.module.css'

export const metadata: Metadata = {
  title: generateLocationPageTitle('Los Angeles'),
  description: generateLocationPageDescription('Los Angeles'),
  openGraph: {
    title: generateLocationPageTitle('Los Angeles'),
    description: generateLocationPageDescription('Los Angeles'),
    type: 'website',
  },
  alternates: {
    canonical: '/tutors-in-los-angeles',
  },
}

export default function TutorsInLAPage() {
  const tutors = getPublicTutors()
  
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Tutors in Los Angeles</h1>
            <p className={styles.subtitle}>
              Expert AP tutoring from UCLA students. Online sessions available for students in Los Angeles and beyond.
            </p>
          </div>

          <div className={styles.grid}>
            {tutors.map((tutor) => (
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
              Online AP Tutoring for Los Angeles Students
            </h2>
            <p style={{ lineHeight: '1.8', color: '#555', marginBottom: '1rem' }}>
              Bruin Tutors offers expert AP tutoring services for students in Los Angeles. Our UCLA student tutors provide 
              personalized one-on-one sessions online, making it convenient for students throughout the LA area to get the 
              help they need.
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8', color: '#555' }}>
              <li>Online sessions - no need to travel</li>
              <li>UCLA students with proven academic excellence</li>
              <li>Flexible scheduling to fit your busy life</li>
              <li>All AP subjects covered</li>
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
                Book Your Tutoring Session
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

