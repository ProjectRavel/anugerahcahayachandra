import { Package, PackageCheck, BarChart3, Users } from 'lucide-react'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-stretch bg-slate-950">
      {/* Left panel: dark, profesional, dengan background foto */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900">
        {/* Background image (opsional) */}
        <div
          className="absolute inset-0 bg-cover bg-center     opacity-65"
          style={{ backgroundImage: "url('/acc-banner.png')" }}
        />
        {/* Overlay untuk menggelapkan gambar */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/70 via-slate-950/75 to-black/85" />

        {/* Konten teks */}
        <div className="relative z-10 flex flex-col justify-between px-10 py-10 text-slate-50 w-full max-w-xl backdrop-blur-xl bg-slate-900/35 border border-slate-800/70 rounded-3xl shadow-[0_28px_80px_rgba(15,23,42,0.9)]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-slate-900/80 border border-slate-700/80 px-4 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-600/80 overflow-hidden">
                <Image
                  src="/acc-logo.png"
                  alt="Logo PT ACC"
                  width={24}
                  height={24}
                  className="h-full w-full object-contain"
                  priority
                />
              </span>
              <span className="text-[11px] font-medium tracking-wide text-slate-100/90">
                PT ACC · Internal Dashboard
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight leading-tight text-white">
                Sistem ERP
                <br /> PT Anugerah Cahaya Chandra
              </h1>
              <p className="text-[13px] text-slate-300/85 leading-relaxed max-w-md">
                Satu pintu untuk memantau order, stok gudang, dan SDM harian
                dalam lingkungan yang terkontrol dan profesional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-5 text-xs text-slate-200/90">
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-700/70 bg-slate-900/40 backdrop-blur-lg px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950/90 border border-slate-700/80">
                    <Package size={14} className="text-white" />
                  </span>
                  <p className="font-semibold text-slate-50 text-[11px] tracking-tight">
                    Operasional Gudang
                  </p>
                </div>
                <p className="text-[11px] text-slate-300/85 leading-snug">
                  Inbound, outbound, dan level stok terkini.
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-700/70 bg-slate-900/40 backdrop-blur-lg px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950/90 border border-slate-700/80">
                    <PackageCheck size={14} className="text-white" />
                  </span>
                  <p className="font-semibold text-slate-50 text-[11px] tracking-tight">
                    Tim Packing
                  </p>
                </div>
                <p className="text-[11px] text-slate-300/85 leading-snug">
                  Antrean tugas dan status penyelesaian.
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-700/70 bg-slate-900/40 backdrop-blur-lg px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950/90 border border-slate-700/80">
                    <BarChart3 size={14} className="text-white" />
                  </span>
                  <p className="font-semibold text-slate-50 text-[11px] tracking-tight">
                    Supervisor & Manager
                  </p>
                </div>
                <p className="text-[11px] text-slate-300/85 leading-snug">
                  Ringkasan performa operasional harian.
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-700/70 bg-slate-900/40 backdrop-blur-lg px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950/90 border border-slate-700/80">
                    <Users size={14} className="text-white" />
                  </span>
                  <p className="font-semibold text-slate-50 text-[11px] tracking-tight">
                    HR & Absensi
                  </p>
                </div>
                <p className="text-[11px] text-slate-300/85 leading-snug">
                  Data kehadiran staf dan rekap SDM.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300/90">
            <p className="font-medium">Akses hanya untuk karyawan internal PT ACC.</p>
            <p className="text-slate-500/90">
              © {new Date().getFullYear()} PT Anugerah Cahaya Chandra · Semua hak dilindungi.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-6 py-10 lg:py-0 bg-slate-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
