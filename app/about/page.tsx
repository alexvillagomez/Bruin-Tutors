import { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About Us | Expert AP Tutors from UCLA | Bruin Tutors',
  description: 'Learn about Bruin Tutors - a carefully selected team of UCLA students providing expert AP tutoring. Our tutors excel academically and have proven teaching experience.',
  openGraph: {
    title: 'About Us | Bruin Tutors',
    description: 'A carefully selected team of UCLA students providing expert AP tutoring.',
    type: 'website',
  },
  alternates: {
    canonical: '/about',
  },
}

export default function About() {
  return (
    <main className={styles.main}>
      <section className={styles.aboutSection}>
        <div className={styles.aboutContent}>
          <h1 className={styles.headline}>
            A Carefully Selected Team of UCLA Students
          </h1>
          
          <div className={styles.content}>
            <p className={styles.paragraph}>
              Bruin Tutors is a boutique team of UCLA students specializing in AP tutoring 
              and academic skill-building. Our tutors have an average of three years of 
              tutoring experience, beginning as early as high school, and have excelled in 
              the AP courses they teach.
            </p>
            
            <p className={styles.paragraph}>
              Each tutor specializes in a small number of AP subjects—often the same 
              disciplines they currently study and major in at UCLA. Because our tutors 
              are close in age to students, they understand current high school academic 
              pressures and communicate concepts clearly and relatably.
            </p>
            
            <p className={styles.paragraph}>
              Founded by a UCLA student who began tutoring independently in high school, 
              Bruin Tutors has grown by recruiting equally qualified peers. Every tutor 
              is screened for academic strength, teaching ability, and subject mastery. 
              We intentionally stay small and personal—this is not a marketplace, but a 
              carefully curated team.
            </p>
            
            <p className={styles.paragraph}>
              Our teaching philosophy focuses on helping students learn how to learn. 
              We build strong study habits, improve problem-solving skills, and develop 
              confidence. We prioritize long-term academic success over short-term 
              improvement, preparing students not just for exams, but for college and beyond.
            </p>
          </div>
          
          <div className={styles.ctaContainer}>
            <Link href="/tutors" className={styles.ctaButton}>
              Explore Our Tutors →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
