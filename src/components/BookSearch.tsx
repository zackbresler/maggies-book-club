'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SearchResult {
  openLibraryKey: string
  title: string
  author: string
  isbn: string | null
  isbn13: string | null
  coverUrl: string | null
  publishYear: number | null
  pageCount: number | null
}

interface BookSearchProps {
  onSelectBook: (book: SearchResult) => void
}

export function BookSearch({ onSelectBook }: BookSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectingBook, setSelectingBook] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const data = await response.json()
      setResults(data)
    } catch {
      setError('Failed to search books. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBook = async (book: SearchResult) => {
    setSelectingBook(book.openLibraryKey)

    try {
      // Fetch the English edition ISBN from the API
      const response = await fetch(`/api/books/english-isbn?workKey=${encodeURIComponent(book.openLibraryKey)}`)

      if (response.ok) {
        const data = await response.json()
        // Update the book with English edition ISBN if found
        const updatedBook: SearchResult = {
          ...book,
          isbn13: data.isbn13 || book.isbn13,
          isbn: data.isbn10 || book.isbn,
          coverUrl: data.coverId
            ? `https://covers.openlibrary.org/b/id/${data.coverId}-M.jpg`
            : book.coverUrl
        }
        onSelectBook(updatedBook)
      } else {
        // Fall back to original book data if API fails
        onSelectBook(book)
      }
    } catch {
      // Fall back to original book data on error
      onSelectBook(book)
    } finally {
      setSelectingBook(null)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or ISBN..."
          className="flex-1 px-4 py-2 border border-burgundy-300 rounded-md bg-cream-50 focus:outline-none focus:ring-2 focus:ring-burgundy-500 text-burgundy-800"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-burgundy px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="text-burgundy-600 text-sm">{error}</div>
      )}

      {searched && results.length === 0 && !loading && !error && (
        <div className="text-burgundy-500 text-sm">No books found. Try a different search term.</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-burgundy-700">Search Results</h3>
          <div className="divide-y divide-burgundy-200 border border-burgundy-200 rounded-md bg-parchment-light">
            {results.map((book) => (
              <button
                key={book.openLibraryKey}
                onClick={() => handleSelectBook(book)}
                disabled={selectingBook !== null}
                className="w-full flex items-start gap-4 p-4 hover:bg-parchment text-left disabled:opacity-50 transition-colors"
              >
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    width={48}
                    height={72}
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-18 bg-burgundy-100 rounded flex items-center justify-center text-burgundy-300 text-xs">
                    No cover
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-burgundy-800 truncate">{book.title}</h4>
                  <p className="text-sm text-burgundy-600">{book.author}</p>
                  <div className="text-xs text-burgundy-500 mt-1">
                    {book.publishYear && <span>Published: {book.publishYear}</span>}
                    {book.pageCount && <span className="ml-2">{book.pageCount} pages</span>}
                  </div>
                </div>
                {selectingBook === book.openLibraryKey && (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-burgundy"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
