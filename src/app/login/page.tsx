'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [subtitle, setSubtitle] = useState("It's brunch time!")

  useEffect(() => {
    fetch('/api/admin/settings?key=loginSubtitle')
      .then(res => res.json())
      .then(data => { if (data.value) setSubtitle(data.value) })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid name/email or password')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-burgundy-800" style={{ fontFamily: 'var(--font-cinzel-decorative), serif', letterSpacing: '0.05em' }}>
            Maggie&apos;s<br />BookClub
          </h1>
          <p className="mt-4 text-burgundy-600 font-serif italic">
            {subtitle}
          </p>
          <h2 className="mt-8 text-xl font-display text-burgundy-700">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6 parchment-card p-8 rounded-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-burgundy-50 border border-burgundy-200 text-burgundy-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-burgundy-700">
                Name or email address
              </label>
              <input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-burgundy-300 rounded-md shadow-sm bg-cream-50 focus:outline-none focus:ring-burgundy-500 focus:border-burgundy-500 text-burgundy-800"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-burgundy-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-burgundy-300 rounded-md shadow-sm bg-cream-50 focus:outline-none focus:ring-burgundy-500 focus:border-burgundy-500 text-burgundy-800"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-burgundy py-2.5 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-burgundy-600">Don&apos;t have an account? </span>
            <Link href="/register" className="text-burgundy-700 hover:text-burgundy-500 font-semibold">
              Register with invite code
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
