"use client"

import { useEffect, useState } from "react"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Clock, Globe, Copy, Check, Maximize2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { JetBrains_Mono } from "next/font/google"
import { FullscreenTime } from '@/components/fullscreen-time'

// Load JetBrains Mono for numbers
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
})

export default function UTCPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [accuracy, setAccuracy] = useState({ offset: 0, latency: 0 })
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({})
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      // Calculate time accuracy
      const start = performance.now()
      fetch("https://worldtimeapi.org/api/ip")
        .then((response) => response.json())
        .then((data) => {
          const end = performance.now()
          const serverTime = new Date(data.datetime)
          const clientTime = new Date()
          const offset = Math.abs(serverTime.getTime() - clientTime.getTime())
          setAccuracy({
            offset: offset,
            latency: end - start,
          })
        })
        .catch(() => {
          // If API fails, don't update accuracy
        })
    }, 10000)

    return () => clearInterval(timer)
  }, [])

  // Format time as HH:MM:SS in UTC
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Format date in UTC
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Unix timestamp
  const timestamp = Math.floor(currentTime.getTime() / 1000)

  // UTC time
  const utcTime = currentTime.toUTCString()

  // ISO format
  const isoTime = currentTime.toISOString()

  // Copy to clipboard function with feedback
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    }).catch(console.error)
  }

  // UTC-related FAQs
  const utcFaqs = [
    {
      question: "What is UTC time?",
      answer: "UTC (Coordinated Universal Time) is the primary time standard by which the world regulates clocks and time. It is similar to GMT (Greenwich Mean Time) but is more precisely defined by atomic clocks. UTC is the time standard used across the internet and for international communications and aviation."
    },
    {
      question: "Why is UTC important?",
      answer: "UTC is important because it provides a standardized reference time that is not affected by time zones or daylight saving time changes. It serves as the basis for civil time worldwide and is crucial for global communications, aviation, scientific research, and computer systems."
    },
    {
      question: "What is the difference between UTC and GMT?",
      answer: "While UTC and GMT are often used interchangeably and both represent time at the Prime Meridian (0° longitude), they are technically different. GMT is based on the Earth's rotation and the position of the sun, while UTC is based on atomic clocks. In practice, they are usually within 0.9 seconds of each other."
    },
    {
      question: "How do I convert UTC to my local time?",
      answer: "To convert UTC to your local time, you need to add or subtract your timezone's offset from UTC. For example, if you're in Eastern Standard Time (EST), which is UTC-5, you would subtract 5 hours from UTC time. During Daylight Saving Time, this would change to UTC-4."
    },
    {
      question: "Why is UTC used in computing?",
      answer: "UTC is used in computing because it provides a consistent time reference regardless of geographical location. This is essential for timestamping events, synchronizing systems across different time zones, logging, and ensuring consistent data timestamps in distributed systems."
    }
  ]

  return (
    <main className="min-h-screen bg-white dark:bg-black flex flex-col">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
          Datetime.app
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm hidden md:inline">Toggle theme:</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 flex-grow">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Coordinated Universal Time (UTC)
            </h1>
            <h2 className="text-xl md:text-2xl font-medium mb-2 text-muted-foreground">
              The World's Time Standard
            </h2>
            <div className="relative group">
              <div 
                className={`text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none ${jetbrainsMono.className} cursor-pointer`}
                onClick={() => setIsFullscreen(true)}
              >
                {formattedTime}
              </div>
              <button 
                onClick={() => setIsFullscreen(true)}
                className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-all"
                title="Enter fullscreen"
              >
                <Maximize2 className="w-6 h-6" />
              </button>
            </div>
            <p className="text-xl mt-4">{formattedDate}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>UTC/GMT+0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            <Card className="shadow-none rounded-none border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Unix Timestamp</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="inline-flex items-center gap-2">
                  <p className={jetbrainsMono.className}>{timestamp}</p>
                  <button
                    onClick={() => copyToClipboard(timestamp.toString(), 'timestamp')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors group"
                    title="Copy to clipboard"
                  >
                    {copiedStates['timestamp'] ? (
                      <Check className="h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-100 transition-colors" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-100 transition-colors" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-none border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">UTC String</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="inline-flex items-center gap-2">
                  <p className={jetbrainsMono.className}>{utcTime}</p>
                  <button
                    onClick={() => copyToClipboard(utcTime, 'utc')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors group"
                    title="Copy to clipboard"
                  >
                    {copiedStates['utc'] ? (
                      <Check className="h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-100 transition-colors" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-100 transition-colors" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-none border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">ISO 8601</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="inline-flex items-center gap-2">
                  <p className={jetbrainsMono.className}>{isoTime}</p>
                  <button
                    onClick={() => copyToClipboard(isoTime, 'iso')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors group"
                    title="Copy to clipboard"
                  >
                    {copiedStates['iso'] ? (
                      <Check className="h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-100 transition-colors" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-100 transition-colors" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* City Links Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">World City Times</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <a href="/cities/new-york" className="text-primary font-medium py-2 px-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex items-center justify-center">
                New York
              </a>
              <a href="/cities/london" className="text-primary font-medium py-2 px-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex items-center justify-center">
                London
              </a>
              <a href="/cities/tokyo" className="text-primary font-medium py-2 px-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex items-center justify-center">
                Tokyo
              </a>
              <a href="/cities/sydney" className="text-primary font-medium py-2 px-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex items-center justify-center">
                Sydney
              </a>
              <a href="/cities/beijing" className="text-primary font-medium py-2 px-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex items-center justify-center">
                Beijing
              </a>
              <a href="/cities/paris" className="text-primary font-medium py-2 px-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex items-center justify-center">
                Paris
              </a>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-8 max-w-3xl mx-auto text-left">
            <h2 className="text-2xl font-bold mb-6 text-center">UTC Time - Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {utcFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p>{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      <FullscreenTime 
        time={formattedTime}
        isFullscreen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      />
    </main>
  )
}
