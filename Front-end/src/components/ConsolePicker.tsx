import { consolesByPlatform } from '../data/products'

interface ConsolePickerProps {
  /** Platform family whose machines are offered, e.g. 'PlayStation'. */
  platform: string
  value: string[]
  onChange: (consoles: string[]) => void
  /** Tailwind text colour for the label, to match each form's palette. */
  labelClassName?: string
}

/**
 * Multi-select for the machines a game runs on, scoped to its platform family.
 * Shared by the add form (AdminScreen) and the inline edit form
 * (ProductDetailScreen) — both must offer the same options, and the backend
 * rejects anything outside the family.
 */
export default function ConsolePicker({
  platform,
  value,
  onChange,
  labelClassName = 'text-white/70',
}: ConsolePickerProps) {
  const options = consolesByPlatform[platform] ?? []

  const toggle = (model: string) =>
    onChange(
      value.includes(model) ? value.filter((c) => c !== model) : [...value, model],
    )

  return (
    <div>
      <label className={`mb-1 block text-sm ${labelClassName}`}>
        Consoles <span className="text-white/40">(pick at least one)</span>
      </label>
      {options.length === 0 ? (
        <p className="text-sm text-white/40">No consoles listed for {platform}.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((model) => {
            const on = value.includes(model)
            return (
              <label
                key={model}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                  on
                    ? 'border-brand/60 bg-brand/15 text-brand-soft'
                    : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => toggle(model)}
                />
                {model}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
