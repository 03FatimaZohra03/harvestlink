import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-ivory">
      {/* Mobile top nav */}
      <div className="md:hidden bg-surface border-b border-border-ghost p-3 flex justify-between items-center">
        <span className="font-semibold text-lg text-sage">HarvestLink</span>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-muted">Overview</Link>
          <form action="/logout" method="POST" className="inline">
            <button type="submit" className="text-sm text-terracotta">Logout</button>
          </form>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 bg-surface border-r border-border-ghost p-4 flex-shrink-0">
        <div className="font-semibold text-lg text-sage mb-4">HarvestLink</div>
        <nav className="space-y-1">
          <Link href="/dashboard" className="block px-2 py-1.5 rounded hover:bg-surface-container text-sm text-charcoal">Overview</Link>
          <Link href="/browse" className="block px-2 py-1.5 rounded hover:bg-surface-container text-sm text-charcoal">Browse Produce</Link>
          <Link href="/logout" className="block px-2 py-1.5 rounded hover:bg-surface-container text-sm text-terracotta">Log out</Link>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
