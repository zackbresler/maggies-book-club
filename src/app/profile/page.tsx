'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ProtectedLayout } from '@/components/ProtectedLayout'

interface UserRating {
  id: string
  rating: number
  createdAt: string
  book: {
    id: string
    title: string
    author: string
    coverUrl: string | null
  }
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [ratings, setRatings] = useState<UserRating[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    async function fetchUserRatings() {
      try {
        const response = await fetch('/api/profile/ratings')
        if (response.ok) {
          const data = await response.json()
          setRatings(data)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserRatings()
  }, [])

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {session?.user?.name}
          </h1>
          <p className="text-gray-600">{session?.user?.email}</p>
          {session?.user?.isAdmin && (
            <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              Admin
            </span>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setPasswordMessage(null)
              if (newPassword !== confirmPassword) {
                setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
                return
              }
              setChangingPassword(true)
              try {
                const res = await fetch('/api/profile/password', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentPassword, newPassword }),
                })
                const data = await res.json()
                if (res.ok) {
                  setPasswordMessage({ type: 'success', text: data.message })
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                } else {
                  setPasswordMessage({ type: 'error', text: data.error })
                }
              } catch {
                setPasswordMessage({ type: 'error', text: 'Something went wrong' })
              } finally {
                setChangingPassword(false)
              }
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {passwordMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={changingPassword}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Your Ratings</h2>
            {averageRating !== null && (
              <div className="text-sm text-gray-500">
                Average: <span className="font-medium text-yellow-600">{averageRating.toFixed(1)} ★</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven&apos;t rated any books yet.</p>
              <Link
                href="/books"
                className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-500"
              >
                Browse books →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ratings.map((rating) => (
                <div key={rating.id} className="py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/books/${rating.book.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {rating.book.title}
                    </Link>
                    <p className="text-sm text-gray-500">{rating.book.author}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              {ratings.length} book{ratings.length !== 1 ? 's' : ''} rated
            </p>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
