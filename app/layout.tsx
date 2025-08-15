"use client"

import './globals.css'
import NotificationContainer from '@/components/ui/notification-banner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white">
        <main className="max-w-lg mx-auto bg-white min-h-screen">
          {children}
        </main>
        <NotificationContainer />
      </body>
    </html>
  )
}



import './globals.css'