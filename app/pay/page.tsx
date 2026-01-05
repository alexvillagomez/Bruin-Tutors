'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './page.module.css'

export default function PayPage() {
  const searchParams = useSearchParams()
  const tutorSlug = searchParams.get('tutor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Example: Calculate price dynamically
      // TODO: Replace with your custom pricing algorithm
      const priceInDollars = 50 // Example: $50
      const priceInCents = Math.round(priceInDollars * 100) // Convert to cents

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: priceInCents, // Amount in cents
          currency: 'usd',
          description: 'Tutoring Session',
          tutorSlug: tutorSlug || undefined,
          studentEmail: undefined, // Can be pre-filled if you have it
          sessionLength: 60 // Example
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process payment')
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.container}>
          <h1 className={styles.title}>Test Payment</h1>
          <p className={styles.description}>
            This is a test page for Stripe Checkout integration.
          </p>
          {tutorSlug && (
            <p className={styles.tutorInfo}>
              Booking with tutor: <strong>{tutorSlug}</strong>
            </p>
          )}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          <button
            className={styles.button}
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay for Session'}
          </button>
          <p className={styles.note}>
            <strong>Note:</strong> Make sure you have set up your Stripe Price IDs in environment variables.
            See the code comments in <code>app/api/stripe/checkout/route.ts</code> for details.
          </p>
        </div>
      </section>
    </main>
  )
}

