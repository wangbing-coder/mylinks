import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"
import { Analytics } from "@/components/analytics"
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'common' })
  
  const baseUrl = 'https://my-app.com'
  
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: "website",
      url: baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: baseUrl,
    },
    icons: {
      icon: [
        { url: "/favicon-512x512.png", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
    }
  }
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages({ locale: 'en' })

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
          <meta 
            name="google-adsense-account" 
            content={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
          />
        )}
        <Analytics />
      </head>
      <body className={spaceGrotesk.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <main>
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}