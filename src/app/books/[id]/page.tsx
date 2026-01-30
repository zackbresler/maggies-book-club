'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { RatingStars } from '@/components/RatingStars'
import { ExternalLinks } from '@/components/ExternalLinks'
import { DiscussionQuestions } from '@/components/DiscussionQuestions'

interface Rating {
  id: string
  rating: number
  userId: string
  user: {
    id: string
    name: string
  }
}

interface Question {
  id: string
  question: string
  sortOrder: number
}

interface Book {
  id: string
  title: string
  author: string
  isbn: string | null
  isbn13: string | null
  coverUrl: string | null
  synopsis: string | null
  publishYear: number | null
  pageCount: number | null
  status: string
  averageRating: number | null
  ratingCount: number
  ratings: Rating[]
  questions: Question[]
  addedBy: {
    id: string
    name: string
  }
}

const statusLabels: Record<string, string> = {
  CURRENT: 'Current',
  SUGGESTION: 'Future Suggestion',
  COMPLETED: 'Completed'
}

const statusColors: Record<string, string> = {
  CURRENT: 'bg-forest-100 text-forest-700 border border-forest-300',
  SUGGESTION: 'bg-gold-50 text-gold-700 border border-gold-300',
  COMPLETED: 'bg-burgundy-50 text-burgundy-600 border border-burgundy-200'
}

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setBook(data)
      } else {
        setError('Book not found')
      }
    } catch {
      setError('Failed to load book')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBook()
  }, [params.id])

  const handleRatingChange = async (newRating: number) => {
    if (!book) return

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          rating: newRating
        })
      })

      if (response.ok) {
        fetchBook()
      }
    } catch {
      console.error('Failed to save rating')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!book) return

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchBook()
      }
    } catch {
      console.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!book) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/books')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete book')
        setShowDeleteConfirm(false)
      }
    } catch {
      setError('Failed to delete book')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy"></div>
        </div>
      </ProtectedLayout>
    )
  }

  if (error || !book) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12">
          <p className="text-burgundy-400">{error || 'Book not found'}</p>
          <Link href="/books" className="mt-2 text-burgundy-600 hover:text-burgundy-500 font-medium">
            Back to books
          </Link>
        </div>
      </ProtectedLayout>
    )
  }

  const userRating = book.ratings.find((r) => r.userId === session?.user?.id)
  const isAdmin = session?.user?.isAdmin
  const isOwner = book.addedBy.id === session?.user?.id
  const canDelete = isAdmin || (isOwner && book.status === 'SUGGESTION')

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/books" className="text-burgundy-600 hover:text-burgundy-500 text-sm font-medium">
          ← Back to books
        </Link>

        {/* Book Header */}
        <div className="parchment-card rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                width={192}
                height={288}
                className="object-cover rounded shadow-lg self-start border-2 border-burgundy-200"
              />
            ) : (
              <div className="w-48 h-72 bg-burgundy-100 rounded flex items-center justify-center text-burgundy-300 border-2 border-burgundy-200">
                No cover
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-display text-burgundy-800">{book.title}</h1>
                <p className="text-lg text-burgundy-600 italic">by {book.author}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm ${statusColors[book.status]}`}>
                  {statusLabels[book.status]}
                </span>
                {book.publishYear && (
                  <span className="text-sm text-burgundy-500">Published: {book.publishYear}</span>
                )}
                {book.pageCount && (
                  <span className="text-sm text-burgundy-500">{book.pageCount} pages</span>
                )}
              </div>

              {book.averageRating !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-gold">★</span>
                  <span className="text-xl font-semibold text-burgundy-700">{book.averageRating.toFixed(1)}</span>
                  <span className="text-burgundy-500">({book.ratingCount} rating{book.ratingCount !== 1 ? 's' : ''})</span>
                </div>
              )}

              {book.synopsis && (
                <div>
                  <h3 className="font-display text-burgundy-700 mb-1">Synopsis</h3>
                  <p className="text-burgundy-600 leading-relaxed">{book.synopsis}</p>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-burgundy-700 mb-1">
                    Change Status (Admin)
                  </label>
                  <select
                    value={book.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-2 border border-burgundy-300 rounded-md bg-cream focus:outline-none focus:ring-2 focus:ring-burgundy-500 text-burgundy-700"
                  >
                    <option value="SUGGESTION">Future Suggestion</option>
                    <option value="CURRENT">Current</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              )}

              {canDelete && (
                <div className="pt-4 border-t border-burgundy-200">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete this book
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-cream rounded-lg p-6 max-w-md mx-4 parchment-card">
              <h3 className="text-xl font-display text-burgundy-800 mb-2">Delete Book</h3>
              <p className="text-burgundy-600 mb-4">
                Are you sure you want to delete &ldquo;{book.title}&rdquo;? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-burgundy-600 hover:text-burgundy-700 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rate This Book */}
        <div className="parchment-card rounded-lg p-6">
          <h2 className="text-xl font-display text-burgundy-700 mb-4">Rate This Book</h2>
          <RatingStars
            rating={userRating?.rating || 0}
            onRate={handleRatingChange}
            size="large"
          />
          {userRating && (
            <p className="text-sm text-burgundy-500 mt-2">
              Your rating: {userRating.rating} stars
            </p>
          )}
        </div>

        {/* All Ratings */}
        {book.ratings.length > 0 && (
          <div className="parchment-card rounded-lg p-6">
            <h2 className="text-xl font-display text-burgundy-700 mb-4">Member Ratings</h2>
            <div className="divide-y divide-burgundy-200">
              {book.ratings.map((rating) => (
                <div key={rating.id} className="py-3 flex items-center justify-between">
                  <span className="text-burgundy-700">{rating.user.name}</span>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={rating.rating} size="small" readonly />
                    <span className="text-sm text-burgundy-500">({rating.rating})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External Links */}
        {(book.isbn13 || book.isbn) && (
          <ExternalLinks isbn={book.isbn13 || book.isbn || ''} title={book.title} />
        )}

        {/* Discussion Questions */}
        <DiscussionQuestions
          bookId={book.id}
          questions={book.questions}
          isAdmin={isAdmin || false}
          onUpdate={fetchBook}
        />
      </div>
    </ProtectedLayout>
  )
}
