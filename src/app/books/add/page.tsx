'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { BookSearch } from '@/components/BookSearch'
import Image from 'next/image'

interface SelectedBook {
  openLibraryKey: string
  title: string
  author: string
  isbn: string | null
  isbn13: string | null
  coverUrl: string | null
  publishYear: number | null
  pageCount: number | null
}

export default function AddBookPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null)
  const [status, setStatus] = useState('SUGGESTION')
  const [synopsis, setSynopsis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = session?.user?.isAdmin

  const handleSelectBook = (book: SelectedBook) => {
    setSelectedBook(book)
    setSynopsis('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBook) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedBook.title,
          author: selectedBook.author,
          isbn: selectedBook.isbn,
          isbn13: selectedBook.isbn13,
          coverUrl: selectedBook.coverUrl,
          openLibraryKey: selectedBook.openLibraryKey,
          publishYear: selectedBook.publishYear,
          pageCount: selectedBook.pageCount,
          synopsis: synopsis || null,
          status: isAdmin ? status : 'SUGGESTION'
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add book')
      }

      router.push('/books')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display text-burgundy-700 mb-6">
          {isAdmin ? 'Add a Book' : 'Suggest a Book'}
        </h1>

        {!selectedBook ? (
          <div className="parchment-card rounded-lg p-6">
            <h2 className="text-lg font-display text-burgundy-700 mb-4">
              Search for a book
            </h2>
            <BookSearch onSelectBook={handleSelectBook} />
          </div>
        ) : (
          <div className="parchment-card rounded-lg p-6">
            <div className="flex items-start gap-4 mb-6">
              {selectedBook.coverUrl ? (
                <Image
                  src={selectedBook.coverUrl}
                  alt={selectedBook.title}
                  width={96}
                  height={144}
                  className="object-cover rounded shadow-lg border-2 border-burgundy-200"
                />
              ) : (
                <div className="w-24 h-36 bg-burgundy-100 rounded flex items-center justify-center text-burgundy-300 text-sm border-2 border-burgundy-200">
                  No cover
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-display text-burgundy-800">
                  {selectedBook.title}
                </h2>
                <p className="text-burgundy-600 italic">by {selectedBook.author}</p>
                <div className="text-sm text-burgundy-500 mt-1">
                  {selectedBook.publishYear && (
                    <span>Published: {selectedBook.publishYear}</span>
                  )}
                  {selectedBook.pageCount && (
                    <span className="ml-2">{selectedBook.pageCount} pages</span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="mt-2 text-sm text-burgundy-600 hover:text-burgundy-500 font-medium"
                >
                  Choose a different book
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-burgundy-50 border border-burgundy-200 text-burgundy-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {isAdmin && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-burgundy-700">
                    Initial Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-burgundy-300 rounded-md bg-cream focus:outline-none focus:ring-2 focus:ring-burgundy-500 text-burgundy-700"
                  >
                    <option value="SUGGESTION">Future Suggestion</option>
                    <option value="CURRENT">Current</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="synopsis" className="block text-sm font-medium text-burgundy-700">
                  Synopsis (optional)
                </label>
                <textarea
                  id="synopsis"
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  rows={4}
                  placeholder="Add a brief description of the book..."
                  className="mt-1 block w-full px-3 py-2 border border-burgundy-300 rounded-md bg-cream-50 focus:outline-none focus:ring-2 focus:ring-burgundy-500 text-burgundy-800"
                />
                <p className="mt-1 text-xs text-burgundy-500">
                  If left empty, we&apos;ll try to fetch a description from Open Library.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-burgundy px-4 py-2.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (isAdmin ? 'Adding...' : 'Adding Suggestion...')
                    : (isAdmin ? 'Add Book' : 'Add Suggestion')
                  }
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/books')}
                  className="px-4 py-2.5 border border-burgundy-300 text-burgundy-700 rounded-md hover:bg-parchment"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
