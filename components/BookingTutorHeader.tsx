import styles from './BookingTutorHeader.module.css'

interface BookingTutorHeaderProps {
  tutorId: string
  name: string
  imageSrc?: string
  subjects: string[]
}

export default function BookingTutorHeader({
  tutorId,
  name,
  imageSrc,
  subjects
}: BookingTutorHeaderProps) {
  return (
    <div className={styles.container}>
      {imageSrc && (
        <div className={styles.imageWrapper}>
          <img 
            src={imageSrc} 
            alt={`Photo of ${name}`}
            className={styles.image}
          />
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        {subjects && subjects.length > 0 && (
          <div className={styles.subjects}>
            {subjects.map(subject => (
              <span key={subject} className={styles.subjectTag}>
                {subject}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

