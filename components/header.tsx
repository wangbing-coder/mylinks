"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Header() {
  return (
    <header className="container mx-auto px-4 py-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
        Datetime.app
      </Link>
      <div className="flex items-center gap-2">
        <span className="text-sm hidden md:inline">Toggle theme:</span>
        <ThemeToggle />
      </div>
    </header>
  )
}
