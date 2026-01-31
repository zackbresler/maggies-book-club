'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface SiteSettings {
  siteName: string
  theme: string
}

const defaultSettings: SiteSettings = {
  siteName: "Maggie's Book Club",
  theme: 'classic',
}

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings)

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}

export function SiteSettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode
  initialSettings?: Partial<SiteSettings>
}) {
  const [settings, setSettings] = useState<SiteSettings>({
    ...defaultSettings,
    ...initialSettings,
  })

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data: Array<{ key: string; value: string }>) => {
        const map: Record<string, string> = {}
        data.forEach((s) => (map[s.key] = s.value))
        setSettings((prev) => ({
          ...prev,
          siteName: map.siteName || prev.siteName,
          theme: map.theme || prev.theme,
        }))
      })
      .catch(() => {})
  }, [])

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  )
}
