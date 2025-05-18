import { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import { Clock, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { calculateYearProgress, calculateTimeLeft } from "@/lib/year-progress"
import YearProgressClient from "./year-progress-client"
import HeaderClient from "./header-client"

// Load JetBrains Mono for numbers
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
})

// Generate metadata with current progress
export async function generateMetadata(): Promise<Metadata> {
  const now = new Date()
  const currentYear = now.getFullYear()
  const progress = calculateYearProgress(now)
  const timeLeft = calculateTimeLeft(now)

  return {
    title: `Year Progress Bar ${currentYear} - ${progress.toFixed(2)}% Complete | Datetime.app`,
    description: `The year ${currentYear} is ${progress.toFixed(2)}% complete with ${timeLeft}. Track the current year's progress with our real-time progress bar.`,
    keywords: ["year progress", "year progress bar", `${currentYear} progress`, `${progress.toFixed(0)}% complete`, "time left in year", "days left in year", "year completion", "year tracker", "time tracking"],
    openGraph: {
      title: `Year Progress Bar ${currentYear} - ${progress.toFixed(2)}% Complete | Datetime.app`,
      description: `The year ${currentYear} is ${progress.toFixed(2)}% complete with ${timeLeft}. Track the current year's progress with our real-time progress bar.`,
      type: "website",
    },
  }
}

export default function YearProgressBar() {
  // Calculate initial values on the server
  const now = new Date()
  const currentYear = now.getFullYear()
  const initialProgress = calculateYearProgress(now)
  const initialTimeLeft = calculateTimeLeft(now)

  // FAQs about year progress
  const yearProgressFaqs = [
    {
      question: "How is the year progress calculated?",
      answer: "The year progress is calculated by determining what percentage of the year has elapsed. We take the current date and time, calculate how many milliseconds have passed since January 1st of the current year, and divide that by the total number of milliseconds in the year."
    },
    {
      question: "Is the year progress calculation accurate?",
      answer: "Yes, our calculation takes into account leap years and is accurate to the second. The progress updates in real-time as you watch the page."
    },
    {
      question: "Can I check the progress of a different year?",
      answer: `Yes, you can view the progress of any year by changing the URL to /year-progress-bar/{year}. For example, to see the progress of 2025, you would use /year-progress-bar/2025.`
    },
    {
      question: "Why track year progress?",
      answer: "Tracking year progress can help with time awareness, goal setting, and planning. It provides a visual reminder of how much of the year has passed and how much time remains for achieving annual goals."
    }
  ]

  return (
    <main className="min-h-screen bg-white dark:bg-black flex flex-col">
      <HeaderClient />

      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">
              Year Progress Bar {currentYear}
            </h1>
            <p className="text-xl text-center text-muted-foreground mb-8">
              <span dangerouslySetInnerHTML={{ __html: `The year ${currentYear} is <strong>${initialProgress.toFixed(2)}%</strong> complete` }} />
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>Year Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Client component for real-time updates */}
                <YearProgressClient
                  initialProgress={initialProgress}
                  initialTimeLeft={initialTimeLeft}
                  currentYear={currentYear}
                />
              </CardContent>
            </Card>

            <div className="text-center mb-8">
              <p className="mb-4">View progress for other years:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((year) => (
                  <Link
                    key={year}
                    href={`/year-progress-bar/${year}`}
                    className={`px-4 py-2 rounded-md ${year === currentYear ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                  >
                    {year}
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 max-w-3xl mx-auto text-left">
              <h2 className="text-2xl font-bold mb-6 text-center">Year Progress - Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {yearProgressFaqs.map((faq, index) => (
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
      </div>
    </main>
  )
}
