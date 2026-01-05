import { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Our Services | AP Tutoring Services | Bruin Tutors',
  description: 'Learn about our AP tutoring services. One-on-one online sessions, flexible scheduling, and expert tutors from UCLA. Available for all AP subjects.',
  openGraph: {
    title: 'Our Services | Bruin Tutors',
    description: 'Expert AP tutoring services with flexible online scheduling.',
    type: 'website',
  },
  alternates: {
    canonical: '/services',
  },
}

export default function Services() {
  return (
    <main className={styles.main}>
      <section className={styles.servicesSection}>
        <div className={styles.servicesContent}>
          <h1 className={styles.headline}>Our Services</h1>
          <p className={styles.intro}>
            We provide personalized, one-on-one tutoring to help high school students 
            succeed in AP courses and build strong academic foundations.
          </p>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>What We Offer</h2>
            <ul className={styles.list}>
              <li>1-on-1 AP and high school tutoring</li>
              <li>Homework help and content support</li>
              <li>Immediate help with questions, assignments, or concepts</li>
              <li>Additional services may be added in the future</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>How Sessions Work</h2>
            <p className={styles.paragraph}>
              Students come with questions and receive immediate help. You may send 
              materials—homework, notes, or practice problems—ahead of time. Standard 
              sessions are 60 minutes.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Subjects Covered</h2>
            <div className={styles.subjectsGrid}>
              <ul className={styles.list}>
                <li>AP Calculus AB</li>
                <li>AP Calculus BC</li>
                <li>AP Physics 1</li>
                <li>AP Physics C</li>
                <li>AP Chemistry</li>
              </ul>
              <ul className={styles.list}>
                <li>AP Biology</li>
                <li>AP English Language</li>
                <li>AP Statistics</li>
                <li>Related high school math and science courses</li>
              </ul>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Delivery Format</h2>
            <ul className={styles.list}>
              <li>Online 1-on-1 tutoring available nationwide</li>
              <li>In-person 1-on-1 tutoring available in Los Angeles only</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pricing</h2>
            <p className={styles.paragraph}>
              Pricing varies based on tutor availability and timing. 
              Full pricing is viewable during booking. Families may contact us with 
              pricing questions.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Free Consultation</h2>
            <p className={styles.paragraph}>
              We offer a free 15-minute consultation to help with tutor matching, goal 
              setting, building short- and long-term plans, and discussing scheduling.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Policies</h2>
            <ul className={styles.list}>
              <li>Full refunds with 48 hours' notice</li>
              <li>Cancellations or reschedules within 48 hours incur a $10 fee</li>
              <li>Late arrivals do not extend session length unless due to an error on our part</li>
              <li>Homework between sessions is optional and can be requested</li>
            </ul>
          </div>

          <div className={styles.ctaContainer}>
            <Link href="/book-now" className={styles.primaryCTA}>
              Book a Session
            </Link>
            <Link href="/contact" className={styles.secondaryCTA}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
