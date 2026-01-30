export interface OpenLibrarySearchResult {
  key: string
  title: string
  author_name?: string[]
  isbn?: string[]
  cover_i?: number
  first_publish_year?: number
  number_of_pages_median?: number
}

export interface OpenLibrarySearchResponse {
  numFound: number
  docs: OpenLibrarySearchResult[]
}

export interface BookSearchResult {
  openLibraryKey: string
  title: string
  author: string
  isbn: string | null
  isbn13: string | null
  coverUrl: string | null
  publishYear: number | null
  pageCount: number | null
}

function mapDocToResult(doc: OpenLibrarySearchResult): BookSearchResult {
  const isbns = doc.isbn || []
  const isbn13 = isbns.find((isbn) => isbn.length === 13) || null
  const isbn10 = isbns.find((isbn) => isbn.length === 10) || null

  return {
    openLibraryKey: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] || 'Unknown Author',
    isbn: isbn10,
    isbn13: isbn13,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : isbn13
        ? `https://covers.openlibrary.org/b/isbn/${isbn13}-M.jpg`
        : null,
    publishYear: doc.first_publish_year || null,
    pageCount: doc.number_of_pages_median || null
  }
}

async function searchOpenLibrary(query: string): Promise<OpenLibrarySearchResult[]> {
  const encodedQuery = encodeURIComponent(query)
  const url = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=10&fields=key,title,author_name,isbn,cover_i,first_publish_year,number_of_pages_median`

  const response = await fetch(url)

  if (!response.ok) {
    return []
  }

  const data: OpenLibrarySearchResponse = await response.json()
  return data.docs
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const trimmedQuery = query.trim()

  // Build different search variations to improve results
  const searchVariations: string[] = [trimmedQuery]

  // Add wildcard version for partial matches (e.g., "Oathbrin" -> "Oathbrin*")
  if (!trimmedQuery.endsWith('*')) {
    searchVariations.push(`${trimmedQuery}*`)
  }

  // If query has spaces, also try without spaces for compound words
  // e.g., "oath bringer" -> "oathbringer"
  if (trimmedQuery.includes(' ')) {
    const noSpaces = trimmedQuery.replace(/\s+/g, '')
    searchVariations.push(noSpaces)
    searchVariations.push(`${noSpaces}*`)
  }

  // If query looks like one word, try splitting common patterns
  // e.g., "oathbringer" could also be searched as "oath bringer"
  if (!trimmedQuery.includes(' ') && trimmedQuery.length > 6) {
    // Add spaces before common word boundaries (capital letters in camelCase)
    const withSpaces = trimmedQuery.replace(/([a-z])([A-Z])/g, '$1 $2')
    if (withSpaces !== trimmedQuery) {
      searchVariations.push(withSpaces)
    }
  }

  // Run searches in parallel (limit to first 3 variations to avoid too many requests)
  const uniqueVariations = Array.from(new Set(searchVariations)).slice(0, 3)
  const searchPromises = uniqueVariations.map(v => searchOpenLibrary(v))

  const allResults = await Promise.all(searchPromises)

  // Combine and deduplicate results by openLibraryKey
  const seenKeys = new Set<string>()
  const combinedDocs: OpenLibrarySearchResult[] = []

  for (const docs of allResults) {
    for (const doc of docs) {
      if (!seenKeys.has(doc.key)) {
        seenKeys.add(doc.key)
        combinedDocs.push(doc)
      }
    }
  }

  // Return top 10 results
  return combinedDocs.slice(0, 10).map(mapDocToResult)
}

export async function getBookByIsbn(isbn: string): Promise<{
  title: string
  description?: string
} | null> {
  const url = `https://openlibrary.org/isbn/${isbn}.json`

  const response = await fetch(url)

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  return {
    title: data.title,
    description: typeof data.description === 'string'
      ? data.description
      : data.description?.value
  }
}

export async function getBookByOpenLibraryKey(key: string): Promise<{
  title: string
  description?: string
} | null> {
  // The key from search is like "/works/OL12345W", we need to fetch the work details
  const url = `https://openlibrary.org${key}.json`

  const response = await fetch(url)

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  return {
    title: data.title,
    description: typeof data.description === 'string'
      ? data.description
      : data.description?.value
  }
}

interface OpenLibraryEdition {
  key: string
  title: string
  isbn_13?: string[]
  isbn_10?: string[]
  languages?: { key: string }[]
  covers?: number[]
}

interface EditionsResponse {
  entries: OpenLibraryEdition[]
}

/**
 * Fetches the English edition ISBN for a given Open Library work key.
 * Falls back to any edition if no English edition is found.
 */
export async function getEnglishEditionIsbn(workKey: string): Promise<{
  isbn13: string | null
  isbn10: string | null
  coverId: number | null
} | null> {
  try {
    // Fetch editions for this work
    const url = `https://openlibrary.org${workKey}/editions.json?limit=50`
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const data: EditionsResponse = await response.json()
    const editions = data.entries || []

    if (editions.length === 0) {
      return null
    }

    // First, try to find an English edition
    const englishEdition = editions.find(edition => {
      const languages = edition.languages || []
      return languages.some(lang =>
        lang.key === '/languages/eng' || lang.key === '/languages/en'
      )
    })

    // If we found an English edition, use its ISBN
    if (englishEdition) {
      return {
        isbn13: englishEdition.isbn_13?.[0] || null,
        isbn10: englishEdition.isbn_10?.[0] || null,
        coverId: englishEdition.covers?.[0] || null
      }
    }

    // If no language is specified on any edition, try to find one with ISBN
    // (many older entries don't have language tags)
    const editionWithIsbn = editions.find(edition =>
      (edition.isbn_13 && edition.isbn_13.length > 0) ||
      (edition.isbn_10 && edition.isbn_10.length > 0)
    )

    if (editionWithIsbn) {
      return {
        isbn13: editionWithIsbn.isbn_13?.[0] || null,
        isbn10: editionWithIsbn.isbn_10?.[0] || null,
        coverId: editionWithIsbn.covers?.[0] || null
      }
    }

    return null
  } catch (error) {
    console.error('Failed to fetch English edition:', error)
    return null
  }
}
