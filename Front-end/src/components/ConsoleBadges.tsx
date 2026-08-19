import { consoleFamily } from '../data/products'

interface ConsoleBadgesProps {
  consoles?: string[]
  /** 'sm' for grid cards, 'md' for the large poster on the product page. */
  size?: 'sm' | 'md'
}

// Each family's house colour, so a badge reads as a platform mark at a glance
// rather than as another grey chip. Full literals — Tailwind can't see
// interpolated class names.
const familyClass: Record<string, string> = {
  PlayStation: 'bg-[#0070d1]/90 ring-white/25',
  Xbox: 'bg-[#107c10]/90 ring-white/25',
  Nintendo: 'bg-[#e60012]/90 ring-white/25',
  PC: 'bg-slate-600/90 ring-white/25',
}
const unknownClass = 'bg-black/60 ring-white/15'

const sizeClass = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
} as const

/**
 * The machines a game runs on, as small badges pinned along the bottom of its
 * cover tile. Renders nothing for hardware, which carries no console list.
 */
export default function ConsoleBadges({ consoles, size = 'sm' }: ConsoleBadgesProps) {
  if (!consoles?.length) return null

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-10 flex flex-wrap justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent ${
        size === 'sm' ? 'p-2 pt-6' : 'p-3 pt-8'
      }`}
    >
      {consoles.map((model) => (
        <span
          key={model}
          className={`rounded-md font-semibold tracking-wide text-white shadow ring-1 backdrop-blur ${
            familyClass[consoleFamily[model]] ?? unknownClass
          } ${sizeClass[size]}`}
        >
          {model}
        </span>
      ))}
    </div>
  )
}
