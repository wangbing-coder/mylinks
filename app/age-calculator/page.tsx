import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Clock, Calendar } from "lucide-react"
import HeaderClient from "../year-progress-bar/header-client"
import AgeCalculatorClient from "./age-calculator-client"

export default function AgeCalculator() {
  // FAQ items about age calculation
  const ageCalculatorFaqs = [
    {
      question: "How is age calculated?",
      answer: "Age is calculated by determining the time elapsed between your birth date and the current date (or a custom date you specify). Our calculator provides the precise age in years, months, days, hours, minutes, and seconds. We account for leap years, varying month lengths, and other calendar complexities to ensure accuracy."
    },
    {
      question: "Why might my age calculation differ from other calculators?",
      answer: "Age calculations can vary slightly between different calculators due to how they handle partial months and days. Some calculators might round to the nearest year, while others (like ours) provide a more detailed breakdown including months and days. Our calculator uses precise algorithms to account for leap years and varying month lengths."
    },
    {
      question: "Can I calculate age between two specific dates?",
      answer: "Yes! Our calculator allows you to calculate age between any two dates. Simply enter your birth date and then toggle the 'Use custom date' option to specify the target date for the age calculation. This is useful for determining how old you were (or will be) on a specific date."
    },
    {
      question: "How do I enter my birth date?",
      answer: "You have two options for entering your birth date: using the calendar picker or manual input. The calendar picker allows you to select a date visually, while manual input lets you type in the year, month, and day directly. Choose whichever method is more convenient for you."
    },
    {
      question: "How accurate is the age calculation?",
      answer: "Our age calculator is accurate to the second. It updates in real-time (when using current date) and takes into account leap years, different month lengths, and daylight saving time changes. For most practical purposes, this level of precision is more than sufficient."
    },
    {
      question: "What is decimal age?",
      answer: "Decimal age represents your age as a single number with a decimal portion, rather than separate years, months, and days. For example, 25.75 years means you are 25 years and 9 months old (since 0.75 years equals about 9 months). This format is sometimes used in scientific or medical contexts."
    },
    {
      question: "Why would I need to know my exact age?",
      answer: "Knowing your exact age can be useful for various purposes: medical assessments, astrological calculations, legal documentation, or simply satisfying curiosity. Some cultures also celebrate specific age milestones that require precise calculation."
    },
    {
      question: "Why doesn't the Next Birthday information appear when using a custom date?",
      answer: "The Next Birthday calculation is based on the current date and shows how many days until your next birthday from today. When using a custom target date, this information isn't shown because it wouldn't be relevant to the custom date you've specified."
    }
  ]

  return (
    <main className="min-h-screen bg-white dark:bg-black flex flex-col">
      <HeaderClient />

      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">
              Age Calculator
            </h1>
            <p className="text-xl text-center text-muted-foreground mb-8">
              Calculate your exact age in years, months, days, and more - with flexible date input options
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <Calculator className="h-5 w-5" />
                  <span>Calculate Your Age</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgeCalculatorClient />
              </CardContent>
            </Card>

            {/* Information Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center">About Age Calculation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Calendar Precision</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Our age calculator accounts for leap years, varying month lengths, and daylight saving time changes to provide the most accurate calculation possible.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Real-time Updates</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Once you select your birth date, the calculator updates in real-time, showing your age down to the second as time passes.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 max-w-3xl mx-auto text-left">
              <h2 className="text-2xl font-bold mb-6 text-center">Age Calculator - Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {ageCalculatorFaqs.map((faq, index) => (
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
