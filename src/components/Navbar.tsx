'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

export function Navbar() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { siteName } = useSiteSettings()

  return (
    <nav className="leather-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="book-title text-2xl sm:text-3xl">
                {siteName}
              </span>
            </Link>
            {session && (
              <div className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-amber-300 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/books"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-amber-300 transition-colors"
                >
                  Books
                </Link>
                <Link
                  href="/books/add"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-amber-300 transition-colors"
                >
                  {session.user?.isAdmin ? 'Add Book' : 'Suggest Book'}
                </Link>
                {session.user?.isAdmin && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-medium text-white hover:text-amber-300 transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          {session ? (
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <Link
                href="/profile"
                className="text-sm font-medium text-white hover:text-amber-300 transition-colors"
              >
                {session.user?.name}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex sm:items-center">
              <Link
                href="/login"
                className="text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-amber-300"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-burgundy-700 border-t border-burgundy-600">
          <div className="pt-2 pb-3 space-y-1">
            {session ? (
              <>
                <Link
                  href="/"
                  className="block px-4 py-2 text-base font-medium text-white hover:bg-burgundy-600 hover:text-amber-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/books"
                  className="block px-4 py-2 text-base font-medium text-white hover:bg-burgundy-600 hover:text-amber-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Books
                </Link>
                <Link
                  href="/books/add"
                  className="block px-4 py-2 text-base font-medium text-white hover:bg-burgundy-600 hover:text-amber-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {session.user?.isAdmin ? 'Add Book' : 'Suggest Book'}
                </Link>
                {session.user?.isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-base font-medium text-white hover:bg-burgundy-600 hover:text-amber-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-base font-medium text-white hover:bg-burgundy-600 hover:text-amber-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile ({session.user?.name})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/login' })
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-200 hover:bg-burgundy-600 hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-4 py-2 text-base font-medium text-amber-300 hover:bg-burgundy-600 hover:text-amber-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
