'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ProtectedLayout } from '@/components/ProtectedLayout'

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
  const [savingSubtitle, setSavingSubtitle] = useState(false)
  const [subtitleMessage, setSubtitleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchData()
      fetch('/api/admin/settings?key=loginSubtitle')
        .then(res => res.json())
        .then(data => { if (data.value) setLoginSubtitle(data.value) })
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
              setSavingSubtitle(true)
              setSubtitleMessage(null)
              try {
                const res = await fetch('/api/admin/settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: 'loginSubtitle', value: loginSubtitle }),
                })
                if (res.ok) {
                  setSubtitleMessage({ type: 'success', text: 'Subtitle updated' })
                } else {
                  setSubtitleMessage({ type: 'error', text: 'Failed to save' })
                }
              } catch {
                setSubtitleMessage({ type: 'error', text: 'Something went wrong' })
              } finally {
                setSavingSubtitle(false)
              }
            }}
            className="space-y-3"
          >
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
            {subtitleMessage && (
              <p className={`text-sm ${subtitleMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {subtitleMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={savingSubtitle}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {savingSubtitle ? 'Saving...' : 'Save'}
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
