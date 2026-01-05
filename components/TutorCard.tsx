import Link from 'next/link'
import Image from 'next/image'
import styles from './TutorCard.module.css'

export type TutorCardProps = {
  id: string
  name: string
  description: string
  subjects: string[]
  photoUrl?: string | null
}

export default function TutorCard({
  id,
  name,
  description,
  subjects,
  photoUrl
}: TutorCardProps) {
  const firstName = name.split(' ')[0]

  return (
    <Link href={`/book-now?tutor=${id}`} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.imageContainer}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${name} - Tutor`}
              width={300}
              height={300}
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholderImage}>
              <span className={styles.placeholderText}>{firstName.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className={styles.content}>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.description}>{description}</p>
          {subjects.length > 0 && (
            <div className={styles.subjects}>
              {subjects.map((subject) => (
                <span key={subject} className={styles.subjectTag}>
                  {subject}
                </span>
              ))}
            </div>
          )}
          <div className={styles.bookButton}>
            Book with {firstName}
          </div>
        </div>
      </article>
    </Link>
  )
}

