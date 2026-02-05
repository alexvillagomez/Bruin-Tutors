import { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Header from '@/components/Header'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://bruintutors.com'),
  title: {
    default: 'Bruin Tutors | AP Tutoring from UCLA Students',
    template: '%s | Bruin Tutors',
  },
  description: 'Expert AP tutoring from high-achieving UCLA students. One-on-one online sessions for all AP subjects. Book your session today.',
  keywords: ['AP tutor', 'AP tutoring', 'UCLA tutors', 'online AP tutoring', 'AP Calculus', 'AP Physics', 'AP Chemistry'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Bruin Tutors',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'Bruin Tutors',
              description: 'Expert AP tutoring from high-achieving UCLA students',
              url: process.env.NEXT_PUBLIC_BASE_URL || 'https://bruintutors.com',
              logo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bruintutors.com'}/logo.png`,
              sameAs: [],
              offers: {
                '@type': 'Offer',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
            }),
          }}
        />
      </head>
      <body style={{
        fontFamily: sourceSans.style.fontFamily,
        margin: 0,
        padding: 0,
        backgroundColor: '#FFFFFF'
      }}>
        <Header />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

