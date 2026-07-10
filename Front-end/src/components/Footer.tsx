const columns = [
  { title: 'Shop', links: ['All games', 'All consoles', 'Weekly deals', 'New arrivals'] },
  { title: 'Support', links: ['Contact us', 'Shipping & returns', 'Warranty', 'FAQ'] },
  { title: 'Company', links: ['About', 'Sell to us', 'Careers', 'Blog'] },
]

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-ink/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-soft">
                🎮
              </span>
              <span className="font-bold text-white">ReplayGear</span>
            </div>
            <p className="mt-3 text-sm text-white/60">
              Get restock alerts & deals in your inbox.
            </p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand/60"
              />
              <button
                type="submit"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-soft"
              >
                Join
              </button>
            </form>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/60 transition hover:text-white">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
          <p>© 2026 ReplayGear. Demo store — dummy data.</p>
          <p>Made with ♻️ for gamers.</p>
        </div>
      </div>
    </footer>
  )
}
