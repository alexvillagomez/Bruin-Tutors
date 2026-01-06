'use client'

import { useEffect, useState, useMemo, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import TutorCard from '@/components/TutorCard'
import { getPublicTutors } from '@/lib/tutors'
import { slugifySubject } from '@/lib/seo'
import type { TutorPublic } from '@/lib/types'
import styles from './page.module.css'

function TutorsPageContent() {
  const searchParams = useSearchParams()
  const focusedTutorId = searchParams.get('tutor')
  const tutorRef = useRef<HTMLDivElement>(null)
  
  const [tutors, setTutors] = useState<TutorPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string>('All')

  useEffect(() => {
    // Fetch tutors from API (which uses the single source of truth)
    async function fetchTutors() {
      try {
        const response = await fetch('/api/tutors')
        if (!response.ok) throw new Error('Failed to fetch tutors')
        const data = await response.json()
        setTutors(data)
      } catch (error) {
        console.error('Error fetching tutors:', error)
        // Fallback to direct import if API fails
        const publicTutors = getPublicTutors()
        setTutors(publicTutors)
      } finally {
        setLoading(false)
      }
    }
    fetchTutors()
  }, [])

  // Scroll to and highlight focused tutor
  useEffect(() => {
    if (!focusedTutorId || loading || tutors.length === 0) return
    
    // Check if the focused tutor exists in the current tutor list
    const tutorExists = tutors.some(t => t.id === focusedTutorId)
    if (!tutorExists) return
    
    let removeTimeout: NodeJS.Timeout | null = null
    
    // Small delay to ensure DOM is ready
    const scrollTimeout = setTimeout(() => {
      const element = tutorRef.current
      if (!element) return
      
      try {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        // Add highlight class temporarily
        element.classList.add(styles.focusedTutor)
        
        removeTimeout = setTimeout(() => {
          // Check if element still exists before removing class
          if (element && element.parentNode) {
            try {
              element.classList.remove(styles.focusedTutor)
            } catch (e) {
              // Element may have been removed, ignore silently
            }
          }
        }, 2000)
      } catch (e) {
        // Element may have been removed, ignore silently
        console.warn('Could not scroll to tutor:', e)
      }
    }, 100)
    
    return () => {
      clearTimeout(scrollTimeout)
      if (removeTimeout) {
        clearTimeout(removeTimeout)
      }
    }
  }, [focusedTutorId, loading, tutors])

  // Extract all unique subjects from tutors
  const allSubjects = useMemo(() => {
    const subjectsSet = new Set<string>()
    tutors.forEach(tutor => {
      tutor.subjects.forEach(subject => subjectsSet.add(subject))
    })
    return Array.from(subjectsSet).sort()
  }, [tutors])

  // Filter tutors based on selected subject
  const filteredTutors = useMemo(() => {
    if (selectedSubject === 'All') {
      return tutors
    }
    return tutors.filter(tutor => 
      tutor.subjects.includes(selectedSubject)
    )
  }, [tutors, selectedSubject])

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Meet Our Tutors</h1>
            <p className={styles.subtitle}>
              Choose a tutor and book in seconds.
            </p>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <p>Loading tutors...</p>
            </div>
          ) : tutors.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No tutors available at this time. Please check back later.</p>
            </div>
          ) : (
            <>
              {/* Subject Filter */}
              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>Filter by Subject:</label>
                <div className={styles.filterButtons}>
                  <button
                    className={`${styles.filterButton} ${selectedSubject === 'All' ? styles.filterButtonActive : ''}`}
                    onClick={() => setSelectedSubject('All')}
                  >
                    All
                  </button>
                  {allSubjects.map(subject => (
                    <Link
                      key={subject}
                      href={`/${slugifySubject(subject)}-tutors`}
                      className={styles.filterButton}
                    >
                      {subject}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Tutors Grid */}
              {filteredTutors.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No tutors available for {selectedSubject}. Try selecting a different subject.</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {filteredTutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      ref={focusedTutorId === tutor.id ? tutorRef : null}
                      className={focusedTutorId === tutor.id ? styles.tutorWrapper : undefined}
                    >
                      <TutorCard
                        id={tutor.id}
                        name={tutor.displayName}
                        description={tutor.blurb}
                        subjects={tutor.subjects}
                        photoUrl={tutor.photoUrl}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default function TutorsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TutorsPageContent />
    </Suspense>
  )
}
