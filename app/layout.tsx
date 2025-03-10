"use client"

import { Inter } from 'next/font/google'
import '../app/globals.css'
import { ToastProvider } from "../components/ui/toast"
import { Toaster } from "../components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>
        <ToastProvider>
          <main className="max-w-lg mx-auto bg-white min-h-screen">
            {children}
          </main>
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}



import './globals.css'