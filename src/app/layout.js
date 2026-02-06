import './globals.css'

export const metadata = {
  title: 'Priced In - Building Job Estimator',
  description: 'AI-powered pricing app for NZ builders',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
