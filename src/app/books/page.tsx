'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ProtectedLayout } from '@/components/ProtectedLayout'

interface Book {
  id: string
  title: string
  author: string
  coverUrl: string | null
  status: string
  publishYear: number | null
  averageRating: number | null
  ratingCount: number
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

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    async function fetchBooks() {
      try {
        const url = filter ? `/api/books?status=${filter}` : '/api/books'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setBooks(data)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [filter])

  const groupedBooks = books.reduce((acc, book) => {
    if (!acc[book.status]) {
      acc[book.status] = []
    }
    acc[book.status].push(book)
    return acc
  }, {} as Record<string, Book[]>)

  const statusOrder = ['CURRENT', 'SUGGESTION', 'COMPLETED']

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display text-burgundy-700">Books</h1>
          <Link
            href="/books/add"
            className="btn-burgundy px-5 py-2 rounded-md"
          >
            Add Book
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === ''
                ? 'btn-burgundy'
                : 'bg-parchment border border-burgundy-200 text-burgundy-600 hover:bg-parchment-dark'
            }`}
          >
            All
          </button>
          {statusOrder.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === status
                  ? 'btn-burgundy'
                  : 'bg-parchment border border-burgundy-200 text-burgundy-600 hover:bg-parchment-dark'
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 parchment-card rounded-lg">
            <p className="text-burgundy-400">No books found.</p>
            <Link
              href="/books/add"
              className="mt-2 inline-flex items-center text-burgundy-600 hover:text-burgundy-500 font-medium"
            >
              Add the first book →
            </Link>
          </div>
        ) : filter ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {statusOrder.map((status) => {
              const statusBooks = groupedBooks[status]
              if (!statusBooks || statusBooks.length === 0) return null

              return (
                <div key={status}>
                  <h2 className="text-xl font-display text-burgundy-600 mb-4 book-divider">
                    {statusLabels[status]}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statusBooks.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="parchment-card rounded-lg hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="flex">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            width={80}
            height={120}
            className="object-cover"
          />
        ) : (
          <div className="w-20 h-30 bg-burgundy-100 flex items-center justify-center text-burgundy-300 text-xs">
            No cover
          </div>
        )}
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-burgundy-800 line-clamp-2">{book.title}</h3>
          <p className="text-sm text-burgundy-600">{book.author}</p>
          {book.publishYear && (
            <p className="text-xs text-burgundy-400 mt-1">{book.publishYear}</p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[book.status]}`}>
              {statusLabels[book.status]}
            </span>
            {book.averageRating !== null && (
              <span className="text-xs text-gold-600 font-medium">
                ★ {book.averageRating.toFixed(1)} ({book.ratingCount})
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
