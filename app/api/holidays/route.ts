import { NextRequest, NextResponse } from "next/server"
import { getHolidays } from "@/lib/holidays"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const country = searchParams.get("country")
  const yearParam = searchParams.get("year")
  const language = searchParams.get("language") || "en"
  const region = searchParams.get("region")
  
  // Validate required parameters
  if (!country) {
    return NextResponse.json(
      { error: "Country parameter is required" },
      { status: 400 }
    )
  }
  
  // Parse year parameter
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
  
  try {
    // Get holidays data
    const holidays = getHolidays(country, year, language, region || undefined)
    
    return NextResponse.json({ holidays })
  } catch (error) {
    console.error("Error fetching holidays:", error)
    return NextResponse.json(
      { error: "Failed to fetch holiday data" },
      { status: 500 }
    )
  }
}
