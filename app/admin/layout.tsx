import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-ivory">
      {/* Mobile top nav */}
      <div className="md:hidden bg-surface border-b border-border-ghost p-3 flex justify-between items-center">
        <span className="font-semibold text-sage">HarvestLink Admin</span>
        <form action="/api/admin/logout" method="POST" className="inline">
          <button type="submit" className="text-sm text-terracotta">Logout</button>
        </form>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 bg-charcoal text-white p-4 flex-shrink-0">
        <div className="font-bold mb-4 text-white">HarvestLink Admin</div>
        <nav className="space-y-1">
          <Link href="/admin" className="block px-2 py-1.5 rounded hover:bg-gray-800 text-sm text-white">Overview</Link>
          <Link href="/admin/users" className="block px-2 py-1.5 rounded hover:bg-gray-800 text-sm text-white">Users</Link>
          <Link href="/admin/produce" className="block px-2 py-1.5 rounded hover:bg-gray-800 text-sm text-white">Produce Listings</Link>
          <Link href="/admin/requests" className="block px-2 py-1.5 rounded hover:bg-gray-800 text-sm text-white">Requests</Link>
          <form action="/api/admin/logout" method="POST" className="pt-4">
            <button type="submit" className="text-sm text-terracotta">Log out</button>
          </form>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
