import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useSearch } from '../context/SearchContext'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../config/routes'

const navLinks: { label: string; to: string }[] = [
  { label: 'Games', to: ROUTES.games },
  { label: 'Consoles', to: ROUTES.consoles },
  { label: 'Deals', to: `${ROUTES.home}#deals` },
  { label: 'Sell to us', to: ROUTES.home },
]

export default function Navbar() {
  const { count } = useCart()
  const { search, setSearch } = useSearch()
  const { user, isAdmin, logout } = useAuth()
  const { pathname } = useLocation()
  // Search only makes sense on the category screens (which render a product grid).
  const showSearch = pathname === ROUTES.games || pathname === ROUTES.consoles

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link to={ROUTES.home} className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-soft text-lg shadow-lg shadow-brand/30">
            🎮
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            Replay<span className="text-brand-soft">Gear</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="ml-4 hidden items-center gap-6 text-sm text-white/70 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.to} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search (catalog only) */}
        <div className={`relative ml-auto w-full max-w-xs ${showSearch ? '' : 'invisible'}`}>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games & consoles…"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-brand/60 focus:bg-white/10"
          />
        </div>

        {/* Cart */}
        <Link
          to={ROUTES.cart}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          aria-label="Cart"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-bold text-white">
              {count}
            </span>
          )}
        </Link>

        {/* Auth */}
        {user ? (
          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && (
              <Link
                to={ROUTES.admin}
                className="hidden rounded-full border border-brand/50 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-soft transition hover:bg-brand/20 sm:block"
              >
                Admin
              </Link>
            )}
            <span className="hidden text-sm text-white/70 sm:block">
              Hi, {user.name.split(' ')[0]}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={ROUTES.login}
              className="rounded-full px-3 py-1.5 text-sm text-white/80 transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              to={ROUTES.register}
              className="rounded-full bg-gradient-to-r from-brand to-brand-soft px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
