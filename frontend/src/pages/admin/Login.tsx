import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Wordmark from '../../components/Wordmark'
import { login } from '../../lib/admin'
import { useAuth } from '../../lib/auth'

export default function Login() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Вход — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    try {
      signIn(await login(username.trim(), password))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти.')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full bg-white/[0.04] border border-white/15 rounded-2xl text-[15px] text-[#F4F6F8] ' +
    'placeholder:text-[#7C838C] px-5 py-3.5 outline-none focus:border-[#C9A86A]/60 transition-colors'

  return (
    <div className="min-h-screen bg-[#0C0D10] grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-[#F4F6F8] text-2xl text-center">
          <Wordmark tracking="0.24em" />
        </Link>
        <p className="text-[10px] tracking-[0.34em] text-[#7C838C] text-center mt-4">
          ПАНЕЛЬ УПРАВЛЕНИЯ
        </p>

        <form onSubmit={submit} className="mt-10 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-[11px] tracking-[0.24em] text-[#7C838C] mb-2.5"
            >
              ЛОГИН
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className={field}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] tracking-[0.24em] text-[#7C838C] mb-2.5"
            >
              ПАРОЛЬ
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={field}
            />
          </div>

          {error && <p className="text-[13px] text-[#C9A86A] leading-relaxed">{error}</p>}

          <button
            type="submit"
            disabled={busy || !username.trim() || !password}
            className="w-full bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors disabled:opacity-40 disabled:hover:bg-[#F4F6F8] disabled:cursor-not-allowed"
          >
            {busy ? 'Вхожу…' : 'Войти'}
          </button>
        </form>

        <Link
          to="/"
          className="block text-center text-[13px] text-[#7C838C] hover:text-[#F4F6F8] transition-colors mt-8"
        >
          ← На сайт
        </Link>
      </div>
    </div>
  )
}
