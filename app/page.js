import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="border-b border-border-ghost bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sage flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">potted_plant</span>
            </div>
            <span className="font-semibold text-lg text-charcoal">HarvestLink</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/browse" className="text-sm text-muted hover:text-sage transition-colors">Browse</Link>
            <Link href="/login" className="text-sm text-muted hover:text-sage transition-colors">Log in</Link>
            <Link href="/register" className="hl-btn-primary text-sm">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 lg:px-6 py-12 lg:py-20 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-muted text-xs mb-4">
          <span className="material-symbols-outlined text-[14px] text-sage" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
          Direct from local fields
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold text-charcoal max-w-2xl mx-auto mb-4 tracking-tight">
          Sell your harvest before it spoils
        </h1>
        <p className="text-base md:text-lg text-muted max-w-xl mx-auto mb-8">
          HarvestLink connects small growers with nearby buyers, transporters, and storage — before freshness slips away.
        </p>
        <Link href="/register" className="hl-btn-primary inline-flex items-center gap-1.5">
          Get started
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
        <div className="flex items-center justify-center gap-2 mt-4 text-muted text-xs">
          <span className="material-symbols-outlined text-[14px] text-sage">check_circle</span>
          <span>Free for small farms</span>
          <span className="text-border-ghost">•</span>
          <span>Set up in 2 mins</span>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="text-center mb-8">
          <span className="text-xs text-sage uppercase tracking-wider font-semibold">3 simple steps</span>
          <h2 className="text-2xl md:text-3xl font-semibold mt-1 text-charcoal">How HarvestLink works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="hl-card p-6">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-sage mb-3">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <h3 className="font-semibold text-lg text-charcoal mb-1">1. List your produce</h3>
            <p className="text-sm text-muted">Post what, how much, where, and until when — in under a minute.</p>
          </div>
          <div className="hl-card p-6">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-sage mb-3">
              <span className="material-symbols-outlined text-[24px]">near_me</span>
            </div>
            <h3 className="font-semibold text-lg text-charcoal mb-1">2. Find nearby buyers</h3>
            <p className="text-sm text-muted">Wholesalers, restaurants, and local markets see your listing in real time.</p>
          </div>
          <div className="hl-card p-6">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-sage mb-3">
              <span className="material-symbols-outlined text-[24px]">local_shipping</span>
            </div>
            <h3 className="font-semibold text-lg text-charcoal mb-1">3. Coordinate pickup</h3>
            <p className="text-sm text-muted">Match, agree on time, and complete the sale — before it spoils.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-ghost bg-surface">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 text-center text-xs text-muted">
          <p className="mb-1">HarvestLink — Connecting local fields with local demand.</p>
          <p>Built for farmers, by farmers.</p>
        </div>
      </footer>
    </main>
  );
}
