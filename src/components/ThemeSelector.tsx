'use client'

const THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Warm bookshop',
    primary: '#722F37',
    background: '#FDF8F3',
    accent: '#C9A227',
    foreground: '#2D2D2D',
  },
  {
    id: 'dark-classic',
    name: 'Dark Classic',
    description: 'Dark mode bookshop',
    primary: '#C06F78',
    background: '#1A1410',
    accent: '#EDD87F',
    foreground: '#E8DDD0',
  },
  {
    id: 'dark-scifi',
    name: 'Dark Sci-Fi',
    description: 'Silo / Westworld / Expanse',
    primary: '#4A90E2',
    background: '#0A0E12',
    accent: '#F5A623',
    foreground: '#C8D6E0',
  },
  {
    id: 'startrek',
    name: 'Star Trek',
    description: 'LCARS / TNG',
    primary: '#6B8EAE',
    background: '#0C0E1A',
    accent: '#CC9933',
    foreground: '#D4CFC0',
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Soft pink romantasy',
    primary: '#DB2777',
    background: '#FFF5F7',
    accent: '#F59E0B',
    foreground: '#2D2D2D',
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Tron / 80s arcade',
    primary: '#FF006E',
    background: '#000814',
    accent: '#FFD60A',
    foreground: '#E0E0E0',
  },
  {
    id: 'mystery',
    name: 'Mystery',
    description: 'Clue / murder mystery',
    primary: '#8B1E1E',
    background: '#1C1410',
    accent: '#B8860B',
    foreground: '#D4C8B8',
  },
]

interface ThemeSelectorProps {
  value: string
  onChange: (theme: string) => void
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          className={`relative rounded-lg border-2 p-3 text-left transition-all ${
            value === theme.id
              ? 'border-indigo-500 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex gap-1.5 mb-2">
            <div
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{ backgroundColor: theme.background }}
              title="Background"
            />
            <div
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{ backgroundColor: theme.primary }}
              title="Primary"
            />
            <div
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{ backgroundColor: theme.accent }}
              title="Accent"
            />
          </div>
          <div className="text-sm font-medium text-gray-900">{theme.name}</div>
          <div className="text-xs text-gray-500">{theme.description}</div>
          {value === theme.id && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
