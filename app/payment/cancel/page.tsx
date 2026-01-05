import Link from 'next/link'
import styles from './page.module.css'

export default function PaymentCancel() {
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.cancelIcon}>✕</div>
          <h1 className={styles.title}>Payment Cancelled</h1>
          <p className={styles.message}>
            Your payment was cancelled. No charges have been made.
          </p>
          <div className={styles.actions}>
            <Link href="/book-now" className={styles.button}>
              Try Again
            </Link>
            <Link href="/tutors" className={styles.buttonSecondary}>
              Browse Tutors
            </Link>
          </div>
          <p className={styles.note}>
            If you experienced any issues, please contact us for assistance.
          </p>
        </div>
      </section>
    </main>
  )
}

