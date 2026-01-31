'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { ThemeSelector } from '@/components/ThemeSelector'

interface InviteCode {
  id: string
  code: string
  createdAt: string
  usedAt: string | null
  createdBy: {
    id: string
    name: string
  }
  usedBy: {
    id: string
    name: string
    email: string
  } | null
}

interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
  createdAt: string
}

interface Book {
  id: string
  title: string
  author: string
  status: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [loginSubtitle, setLoginSubtitle] = useState('')
  const [siteName, setSiteName] = useState("Maggie's Book Club")
  const [selectedTheme, setSelectedTheme] = useState('classic')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchData()
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then((data: Array<{ key: string; value: string }>) => {
          const map: Record<string, string> = {}
          data.forEach((s) => (map[s.key] = s.value))
          if (map.loginSubtitle) setLoginSubtitle(map.loginSubtitle)
          if (map.siteName) setSiteName(map.siteName)
          if (map.theme) setSelectedTheme(map.theme)
        })
        .catch(() => {})
    }
  }, [session])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [codesRes, usersRes, booksRes] = await Promise.all([
        fetch('/api/invite-codes'),
        fetch('/api/users'),
        fetch('/api/books')
      ])

      if (codesRes.ok) {
        setInviteCodes(await codesRes.json())
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json())
      }
      if (booksRes.ok) {
        setBooks(await booksRes.json())
      }
    } finally {
      setLoading(false)
    }
  }

  const generateInviteCode = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/invite-codes', { method: 'POST' })
      if (response.ok) {
        fetchData()
      }
    } finally {
      setGenerating(false)
    }
  }

  const deleteInviteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invite code?')) return

    const response = await fetch(`/api/invite-codes?id=${id}`, { method: 'DELETE' })
    if (response.ok) {
      fetchData()
    }
  }

  const updateBookStatus = async (bookId: string, status: string) => {
    const response = await fetch(`/api/books/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (response.ok) {
      fetchData()
    }
  }

  if (status === 'loading' || (status === 'authenticated' && !session?.user?.isAdmin)) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>

        {/* Invite Codes Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Invite Codes</h2>
            <button
              onClick={generateInviteCode}
              disabled={generating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate New Code'}
            </button>
          </div>

          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : inviteCodes.length === 0 ? (
            <div className="text-gray-500">No invite codes generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Used By</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inviteCodes.map((code) => (
                    <tr key={code.id}>
                      <td className="px-4 py-3 font-mono text-sm">{code.code}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          code.usedBy
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {code.usedBy ? 'Used' : 'Available'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {code.usedBy ? `${code.usedBy.name} (${code.usedBy.email})` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {!code.usedBy && (
                          <button
                            onClick={() => deleteInviteCode(code.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Members</h2>
          {resetMessage && (
            <div className={`mb-4 px-4 py-3 rounded text-sm ${
              resetMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {resetMessage.text}
            </div>
          )}
          {users.length === 0 ? (
            <div className="text-gray-500">No members yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-sm">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.isAdmin
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {resetUserId === user.id ? (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault()
                              setResetting(true)
                              setResetMessage(null)
                              try {
                                const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ password: resetPassword }),
                                })
                                const data = await res.json()
                                if (res.ok) {
                                  setResetMessage({ type: 'success', text: data.message })
                                  setResetUserId(null)
                                  setResetPassword('')
                                } else {
                                  setResetMessage({ type: 'error', text: data.error })
                                }
                              } catch {
                                setResetMessage({ type: 'error', text: 'Something went wrong' })
                              } finally {
                                setResetting(false)
                              }
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="text"
                              value={resetPassword}
                              onChange={(e) => setResetPassword(e.target.value)}
                              placeholder="New password"
                              minLength={8}
                              required
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="submit"
                              disabled={resetting}
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50"
                            >
                              Set
                            </button>
                            <button
                              type="button"
                              onClick={() => { setResetUserId(null); setResetPassword('') }}
                              className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <button
                            onClick={() => setResetUserId(user.id)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            Reset Password
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Site Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Site Settings</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setSavingSettings(true)
              setSettingsMessage(null)
              try {
                const settings = [
                  { key: 'siteName', value: siteName },
                  { key: 'loginSubtitle', value: loginSubtitle },
                  { key: 'theme', value: selectedTheme },
                ]
                const results = await Promise.all(
                  settings.map((s) =>
                    fetch('/api/admin/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(s),
                    })
                  )
                )
                if (results.every((r) => r.ok)) {
                  setSettingsMessage({ type: 'success', text: 'Settings saved. Reloading...' })
                  setTimeout(() => window.location.reload(), 500)
                } else {
                  setSettingsMessage({ type: 'error', text: 'Failed to save some settings' })
                }
              } catch {
                setSettingsMessage({ type: 'error', text: 'Something went wrong' })
              } finally {
                setSavingSettings(false)
              }
            }}
            className="space-y-6"
          >
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">Site Name</label>
              <input
                id="siteName"
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Maggie's Book Club"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">Displayed in the navbar, login page, and browser tab.</p>
            </div>
            <div>
              <label htmlFor="loginSubtitle" className="block text-sm font-medium text-gray-700">Login Page Subtitle</label>
              <input
                id="loginSubtitle"
                type="text"
                value={loginSubtitle}
                onChange={(e) => setLoginSubtitle(e.target.value)}
                placeholder="It's brunch time!"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <ThemeSelector value={selectedTheme} onChange={setSelectedTheme} />
            </div>
            {settingsMessage && (
              <p className={`text-sm ${settingsMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {settingsMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Data Backup & Restore */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Data Backup &amp; Restore</h2>
          <p className="text-sm text-gray-500 mb-4">
            Export all book club data as a JSON file, or restore from a previous backup.
          </p>
          {backupMessage && (
            <div className={`mb-4 px-4 py-3 rounded text-sm ${
              backupMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {backupMessage.text}
            </div>
          )}
          <div className="flex gap-4">
            <a
              href="/api/admin/backup"
              download
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              Export Backup
            </a>
            <label className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50 ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
              {importing ? 'Restoring...' : 'Import Backup'}
              <input
                type="file"
                accept=".json"
                className="hidden"
                disabled={importing}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (!confirm('This will replace ALL existing data with the backup. Are you sure?')) {
                    e.target.value = ''
                    return
                  }
                  setImporting(true)
                  setBackupMessage(null)
                  try {
                    const text = await file.text()
                    const json = JSON.parse(text)
                    const res = await fetch('/api/admin/backup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(json),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      setBackupMessage({ type: 'success', text: data.message })
                      fetchData()
                    } else {
                      setBackupMessage({ type: 'error', text: data.error })
                    }
                  } catch {
                    setBackupMessage({ type: 'error', text: 'Failed to read or restore backup file' })
                  } finally {
                    setImporting(false)
                    e.target.value = ''
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Book Status Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Book Status</h2>
          {books.length === 0 ? (
            <div className="text-gray-500">No books added yet.</div>
          ) : (
            <div className="space-y-4">
              {books.map((book) => (
                <div key={book.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <h3 className="font-medium text-gray-900">{book.title}</h3>
                    <p className="text-sm text-gray-500">{book.author}</p>
                  </div>
                  <select
                    value={book.status}
                    onChange={(e) => updateBookStatus(book.id, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SUGGESTION">Suggestion</option>
                    <option value="CURRENT">Currently Reading</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
