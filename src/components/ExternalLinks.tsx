'use client'

interface ExternalLinksProps {
  isbn: string
  title: string
}

const linkProviders = [
  {
    name: 'StoryGraph',
    getUrl: ({ title }: ExternalLinksProps) => `https://app.thestorygraph.com/browse?search_term=${encodeURIComponent(title)}`,
    icon: '📖'
  },
  {
    name: 'Goodreads',
    getUrl: ({ title }: ExternalLinksProps) => `https://www.goodreads.com/search?q=${encodeURIComponent(title)}`,
    icon: '📚'
  },
  {
    name: 'Omaha Public Library',
    getUrl: ({ title }: ExternalLinksProps) => `https://omaha.bibliocommons.com/v2/search?query=${encodeURIComponent(title)}&searchType=title`,
    icon: '🏛️'
  },
  {
    name: 'Bookshop.org',
    getUrl: ({ title }: ExternalLinksProps) => `https://bookshop.org/search?keywords=${encodeURIComponent(title)}`,
    icon: '🛒'
  }
]

export function ExternalLinks({ isbn, title }: ExternalLinksProps) {
  return (
    <div className="parchment-card rounded-lg p-6">
      <h2 className="text-xl font-display text-burgundy-700 mb-4">Find This Book</h2>
      <div className="grid grid-cols-2 gap-3">
        {linkProviders.map((provider) => (
          <a
            key={provider.name}
            href={provider.getUrl({ isbn, title })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-cream rounded-lg border border-burgundy-200 hover:bg-parchment hover:border-burgundy-300 transition-colors"
          >
            <span className="text-xl">{provider.icon}</span>
            <span className="text-sm font-medium text-burgundy-700">{provider.name}</span>
            <svg
              className="w-4 h-4 ml-auto text-burgundy-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}
