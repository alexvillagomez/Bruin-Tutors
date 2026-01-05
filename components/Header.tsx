'use client'

import Link from 'next/link'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoLink}>
        <img
          src="/logo.png"
          alt="UCLA Bruin Tutors"
          className={styles.logo}
          onError={(e) => {
            // Try alternative formats if logo.png doesn't exist
            const target = e.target as HTMLImageElement;
            if (target.src.includes('logo.png')) {
              target.src = '/logo.jpg';
            } else if (target.src.includes('logo.jpg')) {
              target.src = '/logo.svg';
            }
          }}
        />
      </Link>
      <nav className={styles.nav}>
        <Link href="/about" className={styles.navLink}>
          About
        </Link>
        <Link href="/tutors" className={styles.navLink}>
          Tutors
        </Link>
        <Link href="/services" className={styles.navLink}>
          Service Information
        </Link>
        <Link href="/contact" className={styles.navLink}>
          Contact
        </Link>
      </nav>
      <div className={styles.rightSection}>
        <Link href="/book-now" className={styles.bookButton}>
          BOOK NOW
        </Link>
      </div>
    </header>
  )
}

