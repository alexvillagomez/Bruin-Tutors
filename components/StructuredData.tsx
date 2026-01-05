/**
 * Component for adding structured data (JSON-LD) to pages
 */

interface StructuredDataProps {
  data: object
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}

