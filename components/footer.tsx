"use client"

import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400 mt-16">
      <p className="mb-2">{currentYear} My App - Built with Next.js</p>
      <p className="space-x-4 mb-3">
        <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-200">About</Link>
        <Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-200">Contact</Link>
        <Link href="https://github.com" className="hover:text-gray-900 dark:hover:text-gray-200" target="_blank" rel="noopener noreferrer">GitHub</Link>
      </p>
    </footer>
  )
}
