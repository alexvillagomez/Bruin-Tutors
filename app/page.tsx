import { Metadata } from 'next'
import Link from 'next/link'
import { getPublicTutors } from '@/lib/tutors'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'AP Tutoring from UCLA Students | Online AP Tutors | Bruin Tutors',
  description: 'Expert AP tutoring from high-achieving UCLA students. One-on-one online sessions for AP Calculus, AP Physics, AP Chemistry, AP Language, and more. Book your session today.',
  keywords: 'AP tutor, AP tutoring, UCLA tutors, online AP tutoring, AP Calculus tutor, AP Physics tutor, AP Chemistry tutor, AP Language tutor, AP Literature tutor',
  openGraph: {
    title: 'AP Tutoring from UCLA Students | Bruin Tutors',
    description: 'Expert AP tutoring from high-achieving UCLA students. One-on-one online sessions available.',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  const tutors = getPublicTutors().slice(0, 3) // Show first 3 tutors

  return (
    <main className={styles.main}>
      {/* SECTION 1: HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            AP Tutoring from High-Achieving UCLA Students
          </h1>
          <p className={styles.heroSubheadline}>
            One-on-one support from driven, proven hardworking UCLA students who excel academically 
            and are passionate about sharing their philosophy and approach to success. 
            Streamlined booking for quick sessions, with long-term tutoring opportunities 
            available by reaching out to Alex while availability lasts.
          </p>
          <div className={styles.heroCTAs}>
            <Link href="/book-now" className={styles.primaryCTA}>
              Book Now
            </Link>
            <p className={styles.secondaryText}>
              Fast booking • Flexible scheduling • Online sessions
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: TRUST SNAPSHOT */}
      <section className={styles.trustSnapshot}>
        <div className={styles.trustContent}>
          <h2 className={styles.sectionTitle}>Why Parents Trust Us</h2>
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <h3 className={styles.trustTitle}>AP-Focused Expertise</h3>
              <p className={styles.trustText}>
                Specialized support for Advanced Placement courses and exams.
              </p>
            </div>
            <div className={styles.trustItem}>
              <h3 className={styles.trustTitle}>UCLA Students</h3>
              <p className={styles.trustText}>
                Driven, proven hardworkers who are passionate about sharing their philosophy 
                and approach to academic success. Our tutors have 3–4 years of tutoring experience.
              </p>
            </div>
            <div className={styles.trustItem}>
              <h3 className={styles.trustTitle}>Driven & Proven</h3>
              <p className={styles.trustText}>
                Our tutors are driven hardworkers who have proven their dedication to excellence. 
                They're eager to share the study strategies and mindset that led to their success.
              </p>
            </div>
            <div className={styles.trustItem}>
              <h3 className={styles.trustTitle}>Designed for Serious Students</h3>
              <p className={styles.trustText}>
                Approachable support for motivated high school students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SERVICES */}
      <section className={styles.services}>
        <div className={styles.servicesContent}>
          <h2 className={styles.sectionTitle}>Our Services</h2>
          <div className={styles.servicesGrid}>
            <div className={styles.serviceCard}>
              <h3 className={styles.serviceTitle}>Exam Prep</h3>
              <p className={styles.serviceText}>
                Targeted preparation for AP exams and class exams with practice tests, 
                exam strategies, and focused review sessions to maximize your scores.
              </p>
            </div>
            <div className={styles.serviceCard}>
              <h3 className={styles.serviceTitle}>Homework & Content Support</h3>
              <p className={styles.serviceText}>
                Get immediate assistance with assignments, problem sets, and challenging questions. 
                Our tutors provide concept review and clear instruction, helping you understand 
                material deeply, not just get answers.
              </p>
            </div>
            <div className={styles.serviceCard}>
              <h3 className={styles.serviceTitle}>Study Strategies & Support</h3>
              <p className={styles.serviceText}>
                Learn proven study strategies and techniques from driven hardworkers. 
                Build effective study habits, time management skills, and the mindset for 
                long-term academic success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section className={styles.howItWorks}>
        <div className={styles.howItWorksContent}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Book a Session</h3>
              <p className={styles.stepText}>
                Choose your subject and preferred time. Our streamlined booking process 
                takes less than a minute. For long-term tutoring arrangements, 
                reach out to Alex directly.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Meet Your Tutor</h3>
              <p className={styles.stepText}>
                Connect online for your one-on-one session with a driven tutor who shares 
                their proven philosophy and study strategies. 
                Parents can request a consultation call for guidance.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>See Results</h3>
              <p className={styles.stepText}>
                Track progress and build lasting study habits. 
                Book follow-up sessions as needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: TUTORS PREVIEW */}
      <section className={styles.tutorsPreview}>
        <div className={styles.tutorsContent}>
          <h2 className={styles.sectionTitle}>Meet Our Tutors</h2>
          <p className={styles.tutorsIntro}>
            Our tutors are driven, proven hardworking UCLA students who have been tutoring since high school. 
            They combine academic excellence with proven teaching experience and are passionate about 
            sharing their philosophy and approach to success.
          </p>
          <div className={styles.tutorsGrid}>
            {tutors.map((tutor) => (
              <div key={tutor.id} className={styles.tutorCard}>
                <h3 className={styles.tutorName}>{tutor.displayName}</h3>
                <p className={styles.tutorDetails}>
                  {tutor.subjects.join(', ')}
                </p>
              </div>
            ))}
          </div>
          <Link href="/tutors" className={styles.browseLink}>
            Browse All Tutors →
          </Link>
        </div>
      </section>

      {/* SECTION 6: RESULTS & STUDENT DEVELOPMENT */}
      <section className={styles.results}>
        <div className={styles.resultsContent}>
          <h2 className={styles.sectionTitle}>Results & Student Development</h2>
          <div className={styles.resultsGrid}>
            <div className={styles.resultItem}>
              <h3 className={styles.resultTitle}>Strong AP Scores</h3>
              <p className={styles.resultText}>
                Students improve their AP exam performance through targeted preparation 
                and subject mastery.
              </p>
            </div>
            <div className={styles.resultItem}>
              <h3 className={styles.resultTitle}>Effective Study Habits</h3>
              <p className={styles.resultText}>
                Learn proven study strategies from driven hardworkers. 
                Develop efficient, independent study habits that extend beyond any single course.
              </p>
            </div>
            <div className={styles.resultItem}>
              <h3 className={styles.resultTitle}>Confidence & Independence</h3>
              <p className={styles.resultText}>
                Build the confidence to tackle challenging material 
                and the independence to succeed in college.
              </p>
            </div>
            <div className={styles.resultItem}>
              <h3 className={styles.resultTitle}>Academic Excellence</h3>
              <p className={styles.resultText}>
                Learn the philosophy and habits of driven, proven hardworking students 
                who thrive in rigorous academic environments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: FLEXIBILITY & LONG-TERM SUPPORT */}
      <section className={styles.flexibility}>
        <div className={styles.flexibilityContent}>
          <h2 className={styles.sectionTitle}>Flexible Support Options</h2>
          <div className={styles.flexibilityGrid}>
            <div className={styles.flexibilityItem}>
              <h3 className={styles.flexibilityTitle}>One-Off Sessions</h3>
              <p className={styles.flexibilityText}>
                Need help with a specific topic or exam prep? 
                Book individual sessions whenever you need them. 
                No commitment required.
              </p>
            </div>
            <div className={styles.flexibilityItem}>
              <h3 className={styles.flexibilityTitle}>Long-Term Tutoring</h3>
              <p className={styles.flexibilityText}>
                Long-term tutoring is available for students who want ongoing support. 
                Availability is limited, so reach out to Alex at{' '}
                <a href="mailto:alexvillagomeztutoring@gmail.com" className={styles.emailLink}>
                  alexvillagomeztutoring@gmail.com
                </a>
                {' '}while spots remain to secure your long-term arrangement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: FINAL CTA */}
      <section className={styles.finalCTA}>
        <div className={styles.finalCTAContent}>
          <h2 className={styles.finalCTATitle}>Ready to Get Started?</h2>
          <p className={styles.finalCTAText}>
            Book a session now or browse our tutors to find the right fit for your student.
          </p>
          <div className={styles.finalCTAButtons}>
            <Link href="/book-now" className={styles.finalPrimaryCTA}>
              Book a Session Now
            </Link>
            <Link href="/tutors" className={styles.finalSecondaryCTA}>
              Browse Tutors First
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
