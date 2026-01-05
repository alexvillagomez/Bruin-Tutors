'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading to allow webhook to process
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.container}>
          {loading ? (
            <div className={styles.loading}>
              <h1>Processing your payment...</h1>
              <p>Please wait while we confirm your booking.</p>
            </div>
          ) : (
            <>
              <div className={styles.successIcon}>✓</div>
              <h1 className={styles.title}>Payment Successful!</h1>
              <p className={styles.message}>
                Thank you for your payment. Your booking is being processed.
              </p>
              {sessionId && (
                <p className={styles.sessionId}>
                  Session ID: {sessionId}
                </p>
              )}
              <div className={styles.actions}>
                <Link href="/" className={styles.button}>
                  Return to Home
                </Link>
                <Link href="/book-now" className={styles.buttonSecondary}>
                  Book Another Session
                </Link>
              </div>
              <p className={styles.note}>
                You will receive a Google Calendar invite with your booking details and Zoom link shortly.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

