"use client"

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { ThemeToggle } from "@/components/theme-toggle"

export default function Header() {
  const commonT = useTranslations('common')
  
  return (
    <header className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
          {commonT('title')}
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/about" 
            className="text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {commonT('nav.about')}
          </Link>
          <Link 
            href="/contact" 
            className="text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {commonT('nav.contact')}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
