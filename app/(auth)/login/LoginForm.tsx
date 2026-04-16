'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message || 'Email atau password salah.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="space-y-3 pt-4 border-t border-slate-200/80">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Login Karyawan PT ACC
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Masuk ke Sistem ERP</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Gunakan akun internal yang telah didaftarkan oleh administrator atau HR PT ACC.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 flex items-start gap-3 text-sm text-rose-800 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <div>
            <p className="font-medium">Login gagal</p>
            <p className="text-rose-700 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="relative pt-1.5">
          <label
            htmlFor="email"
            className={`absolute left-3 transition-all duration-200 pointer-events-none ${
              focusedField === 'email' || email
                ? 'top-0 text-[11px] font-medium text-indigo-600 bg-slate-50 px-1'
                : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
            }`}
          >
            Email Akun
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            className={`block w-full rounded-xl border px-4 pb-2.5 pt-5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 ${
              focusedField === 'email'
                ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-500/25 shadow-[0_0_0_1px_rgba(129,140,248,0.55)_inset]'
                : 'border-slate-200 bg-white/70 shadow-[0_0_0_1px_rgba(148,163,184,0.25)_inset] hover:border-slate-300'
            }`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative pt-1.5">
          <label
            htmlFor="password"
            className={`absolute left-3 transition-all duration-200 pointer-events-none ${
              focusedField === 'password' || password
                ? 'top-0 text-[11px] font-medium text-indigo-600 bg-slate-50 px-1'
                : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
            }`}
          >
            Password
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            className={`block w-full rounded-xl border px-4 pb-2.5 pt-5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 ${
              focusedField === 'password'
                ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-500/25 shadow-[0_0_0_1px_rgba(129,140,248,0.55)_inset]'
                : 'border-slate-200 bg-white/70 shadow-[0_0_0_1px_rgba(148,163,184,0.25)_inset] hover:border-slate-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-3.5 w-3.5 rounded cursor-pointer border border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
          />
          <span className="text-[11px] text-slate-500">Ingat saya di perangkat ini</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white cursor-pointer shadow-[0_14px_35px_rgba(79,70,229,0.55)] hover:bg-indigo-500 hover:shadow-[0_20px_55px_rgba(129,140,248,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150 active:scale-95"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
            Memproses...
          </>
        ) : (
          <>
            <LogIn size={16} />
            Masuk ke Dashboard
          </>
        )}
      </button>

      <div className="pt-2 border-t border-slate-100 space-y-2">
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Akses ini hanya diperuntukkan bagi karyawan aktif PT Anugerah Cahaya Chandra.
        </p>
        <p className="text-[10px] text-slate-300 text-center">
          © {new Date().getFullYear()} ACC ERP | Demo
        </p>
      </div>
    </form>
  )
}
