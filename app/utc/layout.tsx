import { Metadata } from "next"

export const metadata: Metadata = {
  title: "UTC Time | Datetime.app",
  description: "View current UTC (Coordinated Universal Time). UTC is the world's time standard, unaffected by time zones or daylight saving time changes.",
  keywords: ["UTC", "Coordinated Universal Time", "world time", "standard time", "GMT", "Greenwich Mean Time", "timezone conversion"],
  openGraph: {
    title: "UTC Time | Datetime.app",
    description: "View current UTC (Coordinated Universal Time). UTC is the world's time standard, unaffected by time zones or daylight saving time changes.",
    type: "website",
  },
}

export default function UTCLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
