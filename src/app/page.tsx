'use client'

import { useEffect, useState } from 'react'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { RatingStars } from '@/components/RatingStars'

interface Announcement {
  id: string
  title: string
  location: string
  dateTime: string
  notes: string | null
}

interface Rating {
  id: string
  rating: number
  createdAt: string
  user: { id: string; name: string }
  book: { id: string; title: string; author: string }
}

interface Book {
  id: string
  title: string
  author: string
  coverUrl: string | null
  isbn: string | null
  isbn13: string | null
  synopsis: string | null
  status: string
  averageRating: number | null
  ratingCount: number
  userRating?: number | null
  ratings?: Array<{
    rating: number
    user: { id: string; name: string }
  }>
}

interface Suggestion {
  id: string
  title: string
  author: string
  coverUrl: string | null
  addedAt: string
  addedBy: { id: string; name: string }
  voteCount: number
}

interface DashboardData {
  currentBooks: Book[]
  suggestions: Suggestion[]
  userVoteBookId: string | null
  recentRatings: Rating[]
  stats: {
    totalBooks: number
    completedBooks: number
    totalRatings: number
  }
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({
    title: 'Next Book Club Meeting',
    location: '',
    dateTime: '',
    notes: ''
  })
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, announcementRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/announcement')
      ])
      if (dashboardRes.ok) {
        setData(await dashboardRes.json())
      }
      if (announcementRes.ok) {
        const announcementData = await announcementRes.json()
        setAnnouncement(announcementData.announcement)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleRate = async (bookId: string, rating: number) => {
    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, rating })
      })
      fetchDashboard()
    } catch (error) {
      console.error('Failed to save rating:', error)
    }
  }

  const handleVote = async (bookId: string) => {
    if (voting) return
    setVoting(true)
    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      })
      fetchDashboard()
    } catch (error) {
      console.error('Failed to save vote:', error)
    } finally {
      setVoting(false)
    }
  }

  const topSuggestions = data?.suggestions.slice(0, 3) || []
  const remainingSuggestions = data?.suggestions.slice(3) || []

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingAnnouncement) return
    setSavingAnnouncement(true)

    try {
      const response = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      })
      if (response.ok) {
        const data = await response.json()
        setAnnouncement(data.announcement)
        setShowAnnouncementForm(false)
        setAnnouncementForm({
          title: 'Next Book Club Meeting',
          location: '',
          dateTime: '',
          notes: ''
        })
      }
    } catch (error) {
      console.error('Failed to save announcement:', error)
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const handleRemoveAnnouncement = async () => {
    try {
      await fetch('/api/announcement', { method: 'DELETE' })
      setAnnouncement(null)
    } catch (error) {
      console.error('Failed to remove announcement:', error)
    }
  }

  const generateICalLink = () => {
    if (!announcement) return ''

    const startDate = new Date(announcement.dateTime)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Maggie\'s Book Club//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${announcement.title}`,
      `LOCATION:${announcement.location}`,
      announcement.notes ? `DESCRIPTION:${announcement.notes.replace(/\n/g, '\\n')}` : '',
      `UID:${announcement.id}@maggiesbookclub`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n')

    return `data:text/calendar;charset=utf-8,${encodeURIComponent(icalContent)}`
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display text-burgundy-800">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="mt-1 text-burgundy-600">
            Here&apos;s what&apos;s happening in the book club.
          </p>
        </div>

        {/* Announcement Banner */}
        {announcement && (
          <div className="bg-gradient-to-r from-gold-100 to-gold-50 border border-gold-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-display text-lg text-burgundy-800 flex items-center gap-2">
                  <span className="text-gold-600">📅</span>
                  {announcement.title}
                </h2>
                <div className="mt-2 space-y-1 text-sm text-burgundy-700">
                  <p>
                    <span className="font-medium">When:</span>{' '}
                    {new Date(announcement.dateTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  <p>
                    <span className="font-medium">Where:</span> {announcement.location}
                  </p>
                  {announcement.notes && (
                    <p className="text-burgundy-600 italic">{announcement.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={generateICalLink()}
                  download="bookclub-meeting.ics"
                  className="px-3 py-2 bg-burgundy-600 text-white text-sm font-medium rounded hover:bg-burgundy-700 transition-colors text-center"
                >
                  Add to Calendar
                </a>
                {session?.user?.isAdmin && (
                  <button
                    onClick={handleRemoveAnnouncement}
                    className="px-3 py-1 text-xs text-burgundy-500 hover:text-burgundy-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin: Set Announcement */}
        {session?.user?.isAdmin && !announcement && !showAnnouncementForm && (
          <button
            onClick={() => setShowAnnouncementForm(true)}
            className="w-full p-4 border-2 border-dashed border-burgundy-300 rounded-lg text-burgundy-600 hover:border-burgundy-400 hover:text-burgundy-700 transition-colors"
          >
            + Set Next Meeting
          </button>
        )}

        {/* Admin: Announcement Form */}
        {session?.user?.isAdmin && showAnnouncementForm && (
          <div className="bg-cream-50 border border-burgundy-200 rounded-lg p-4">
            <h3 className="font-display text-lg text-burgundy-800 mb-4">Set Next Meeting</h3>
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-burgundy-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-burgundy-300 rounded focus:ring-2 focus:ring-burgundy-500 focus:border-burgundy-500"
                  placeholder="Next Book Club Meeting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-burgundy-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={announcementForm.dateTime}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, dateTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-burgundy-300 rounded focus:ring-2 focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-burgundy-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={announcementForm.location}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, location: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-burgundy-300 rounded focus:ring-2 focus:ring-burgundy-500 focus:border-burgundy-500"
                  placeholder="e.g., Maggie's house, 123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-burgundy-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={announcementForm.notes}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-burgundy-300 rounded focus:ring-2 focus:ring-burgundy-500 focus:border-burgundy-500"
                  placeholder="e.g., Bring snacks!"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="px-4 py-2 bg-burgundy-600 text-white font-medium rounded hover:bg-burgundy-700 transition-colors disabled:opacity-50"
                >
                  {savingAnnouncement ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(false)}
                  className="px-4 py-2 text-burgundy-600 hover:text-burgundy-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            {data && (
              <div className="grid grid-cols-3 gap-4">
                <div className="parchment-card rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-burgundy-600">{data.stats.totalBooks}</div>
                  <div className="text-sm text-burgundy-500">Total Books</div>
                </div>
                <div className="parchment-card rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-forest-600">{data.stats.completedBooks}</div>
                  <div className="text-sm text-burgundy-500">Completed</div>
                </div>
                <div className="parchment-card rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gold-600">{data.stats.totalRatings}</div>
                  <div className="text-sm text-burgundy-500">Ratings</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Currently Reading Section */}
              <div className="parchment-card rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-xl font-display text-burgundy-700 mb-4">
                    Currently Reading
                  </h2>
                  {data?.currentBooks && data.currentBooks.length > 0 ? (
                    <div className="space-y-6">
                      {data.currentBooks.map((book) => (
                        <div key={book.id} className="space-y-4 pb-6 border-b border-burgundy-200 last:border-0 last:pb-0">
                          <div className="flex gap-4">
                            {book.coverUrl ? (
                              <Image
                                src={book.coverUrl}
                                alt={book.title}
                                width={80}
                                height={120}
                                className="object-cover rounded shadow-lg border border-burgundy-200"
                              />
                            ) : (
                              <div className="w-20 h-30 bg-burgundy-100 rounded flex items-center justify-center text-burgundy-300 text-xs border border-burgundy-200">
                                No cover
                              </div>
                            )}
                            <div className="flex-1">
                              <Link href={`/books/${book.id}`} className="hover:text-burgundy-500">
                                <h3 className="font-display text-burgundy-800">{book.title}</h3>
                              </Link>
                              <p className="text-sm text-burgundy-600 italic">by {book.author}</p>
                              {book.averageRating !== null && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-gold">★</span>
                                  <span className="text-sm font-medium text-burgundy-700">
                                    {book.averageRating.toFixed(1)}
                                  </span>
                                  <span className="text-sm text-burgundy-500">
                                    ({book.ratingCount} rating{book.ratingCount !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-burgundy-700 mb-2">Rate this book:</p>
                            <RatingStars
                              rating={book.userRating || 0}
                              onRate={(rating) => handleRate(book.id, rating)}
                            />
                          </div>

                          {/* Member ratings */}
                          {book.ratings && book.ratings.length > 0 && (
                            <div className="pt-4 border-t border-burgundy-200">
                              <p className="text-sm font-medium text-burgundy-700 mb-2">Member Ratings:</p>
                              <div className="space-y-1">
                                {book.ratings.map((r, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-burgundy-600">{r.user.name}</span>
                                    <RatingStars rating={r.rating} size="small" readonly />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Link
                            href={`/books/${book.id}`}
                            className="inline-flex items-center text-sm text-burgundy-600 hover:text-burgundy-500 font-medium"
                          >
                            View details →
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p className="text-burgundy-500 text-sm">
                        No book is currently being read.
                      </p>
                      <Link
                        href="/books"
                        className="mt-4 inline-flex items-center text-sm text-burgundy-600 hover:text-burgundy-500 font-medium"
                      >
                        View all books →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Vote for Next Book Section */}
              <div className="parchment-card rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-xl font-display text-burgundy-700 mb-4">
                    Vote for Next Book
                  </h2>
                  {data?.suggestions && data.suggestions.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-burgundy-600 mb-4">
                        {data.userVoteBookId
                          ? 'You can change your vote anytime until the next book is chosen.'
                          : 'Cast your vote for which book we should read next! Vote counts will be revealed after you vote.'}
                      </p>

                      {/* Top suggestions */}
                      <div className="space-y-3">
                        {topSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              data.userVoteBookId === suggestion.id
                                ? 'bg-gold-50 border-gold-300'
                                : 'bg-cream border-burgundy-200 hover:border-burgundy-300'
                            }`}
                          >
                            {suggestion.coverUrl ? (
                              <Image
                                src={suggestion.coverUrl}
                                alt={suggestion.title}
                                width={40}
                                height={60}
                                className="object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-15 bg-burgundy-100 rounded flex items-center justify-center text-burgundy-300 text-xs">
                                ?
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <Link href={`/books/${suggestion.id}`} className="hover:text-burgundy-500">
                                <h4 className="font-medium text-burgundy-800 truncate">{suggestion.title}</h4>
                              </Link>
                              <p className="text-xs text-burgundy-500">{suggestion.author}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {data.userVoteBookId && (
                                <span className="text-sm font-medium text-burgundy-600">
                                  {suggestion.voteCount} vote{suggestion.voteCount !== 1 ? 's' : ''}
                                </span>
                              )}
                              <button
                                onClick={() => handleVote(suggestion.id)}
                                disabled={voting}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  data.userVoteBookId === suggestion.id
                                    ? 'bg-gold text-burgundy-800'
                                    : 'bg-burgundy-100 text-burgundy-700 hover:bg-burgundy-200'
                                } disabled:opacity-50`}
                              >
                                {data.userVoteBookId === suggestion.id ? 'Voted' : 'Vote'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Dropdown for remaining suggestions */}
                      {remainingSuggestions.length > 0 && (
                        <div className="pt-2">
                          <button
                            onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                            className="text-sm text-burgundy-600 hover:text-burgundy-500 font-medium"
                          >
                            {showAllSuggestions
                              ? '− Hide other suggestions'
                              : `+ Show ${remainingSuggestions.length} more suggestion${remainingSuggestions.length !== 1 ? 's' : ''}`}
                          </button>

                          {showAllSuggestions && (
                            <div className="mt-3 space-y-2">
                              {remainingSuggestions.map((suggestion) => (
                                <div
                                  key={suggestion.id}
                                  className={`flex items-center gap-3 p-2 rounded border transition-colors ${
                                    data.userVoteBookId === suggestion.id
                                      ? 'bg-gold-50 border-gold-300'
                                      : 'bg-cream-50 border-burgundy-100 hover:border-burgundy-200'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <Link href={`/books/${suggestion.id}`} className="hover:text-burgundy-500">
                                      <span className="text-sm font-medium text-burgundy-800">{suggestion.title}</span>
                                    </Link>
                                    <span className="text-xs text-burgundy-500"> by {suggestion.author}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {data.userVoteBookId && (
                                      <span className="text-xs text-burgundy-500">
                                        {suggestion.voteCount} vote{suggestion.voteCount !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleVote(suggestion.id)}
                                      disabled={voting}
                                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                        data.userVoteBookId === suggestion.id
                                          ? 'bg-gold text-burgundy-800'
                                          : 'bg-burgundy-100 text-burgundy-700 hover:bg-burgundy-200'
                                      } disabled:opacity-50`}
                                    >
                                      {data.userVoteBookId === suggestion.id ? 'Voted' : 'Vote'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <Link
                        href="/books/add"
                        className="inline-flex items-center text-sm text-burgundy-600 hover:text-burgundy-500 font-medium pt-2"
                      >
                        Suggest a book →
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <p className="text-burgundy-500 text-sm">
                        No suggestions yet. Be the first to suggest a book!
                      </p>
                      <Link
                        href="/books/add"
                        className="mt-4 inline-flex items-center text-sm text-burgundy-600 hover:text-burgundy-500 font-medium"
                      >
                        Suggest a book →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="parchment-card rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-display text-burgundy-700 mb-4">
                  Recent Activity
                </h2>
                {data?.recentRatings && data.recentRatings.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentRatings.map((rating) => (
                      <div key={rating.id} className="flex items-center justify-between py-2 border-b border-burgundy-100 last:border-0">
                        <div className="flex-1">
                          <span className="font-medium text-burgundy-800">{rating.user.name}</span>
                          <span className="text-burgundy-500"> rated </span>
                          <Link href={`/books/${rating.book.id}`} className="text-burgundy-600 hover:text-burgundy-500 font-medium">
                            {rating.book.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2">
                          <RatingStars rating={rating.rating} size="small" readonly />
                          <span className="text-xs text-burgundy-400">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-burgundy-500 text-sm">
                    No recent activity to show.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  )
}
