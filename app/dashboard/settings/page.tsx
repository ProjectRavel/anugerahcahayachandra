const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Area pengaturan dasar untuk lingkungan ERP PT ACC. Bagian ini masih
          sederhana dan bisa dikembangkan untuk manajemen role, batasan akses, dan lain-lain.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Information Aplikasi
          </p>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>
              <span className="text-slate-500">Nama Sistem:</span> ACC ERP
            </li>
            <li>
              <span className="text-slate-500">Versi:</span> v1.0.0 (dev)
            </li>
            <li>
              <span className="text-slate-500">Lingkungan:</span> Development
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Integrasi Supabase
          </p>
          <p className="text-xs text-slate-400 mb-2">
            Nilai di bawah hanya untuk verifikasi konfigurasi environment di dev.
          </p>
          <div className="text-sm text-slate-700 space-y-1">
            <div>
              <span className="text-slate-500">URL:</span>{' '}
              <span className="font-mono text-xs break-all">
                {supabaseUrl ?? 'BELUM DIKONFIGURASI'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
