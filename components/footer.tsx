"use client"

import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400 mt-16">
      <p className="mb-2">{currentYear} BackLinks Checker - Built with Next.js</p>
      <p className="mb-2">Last updated: {new Date().toLocaleDateString()}</p>
    </footer>
  )
}
