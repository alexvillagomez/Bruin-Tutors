'use client'

import Link from 'next/link'
import styles from './page.module.css'

export default function Contact() {
  return (
    <main className={styles.main}>
      <section className={styles.contactSection}>
        <div className={styles.contactContent}>
          <h1 className={styles.headline}>Get in Touch</h1>
          <p className={styles.intro}>
            For contact, please reach out via email to{' '}
            <a href="mailto:alexvillagomeztutoring@gmail.com" className={styles.emailLink}>
              alexvillagomeztutoring@gmail.com
            </a>
            {' '}with any inquiries.
          </p>
          <p className={styles.intro}>
            If interested in joining the team as a tutor, you may also reach out to{' '}
            <a href="mailto:alexvillagomeztutoring@gmail.com" className={styles.emailLink}>
              alexvillagomeztutoring@gmail.com
            </a>
            {' '}if you are a UCLA student.
          </p>

          <div className={styles.ctaContainer}>
            <Link href="/book-now" className={styles.primaryCTA}>
              Book a Session
            </Link>
            <Link href="/book-now" className={styles.secondaryCTA}>
              Schedule a Free Consultation
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
