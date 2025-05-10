import Link from "next/link"

export function Footer() {
  return (
    <footer className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400 mt-16">
      <p className="mb-2">{new Date().getFullYear()} datetime.app - Precise World Time</p>
      <p>
        <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-200">About</Link>
      </p>
    </footer>
  )
}
