'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function BookPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tutorSlug = searchParams.get('tutor')

  useEffect(() => {
    // Redirect to book-now with the tutor parameter
    if (tutorSlug) {
      router.replace(`/book-now?tutor=${tutorSlug}`)
    } else {
      router.replace('/book-now')
    }
  }, [tutorSlug, router])

  return (
    <main style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '50vh',
      color: '#003B5C'
    }}>
      <p>Redirecting to booking page...</p>
    </main>
  )
}

