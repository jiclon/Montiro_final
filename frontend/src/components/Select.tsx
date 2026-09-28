import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type Option = { key: string; label: string }

type Props = {
  value: string
  options: Option[]
  onChange: (key: string) => void
  /** Accessible name, since the visible label sits outside the control. */
  label: string
}

/**
 * A dropdown in the site's own language. The native `<select>` was rendered by
 * the operating system — grey, square, and nothing like the rest of the page.
 *
 * Closes on outside click and on Escape; arrows and Enter work like a real
 * listbox. No `backdrop-filter` anywhere — the panel is a solid surface.
 */
export default function Select({ value, options, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  const index = Math.max(
    0,
    options.findIndex((o) => o.key === value),
  )
  const current = options[index] ?? options[0]

  useEffect(() => {
    if (!open) return

    const onPointer = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (key: string) => {
    onChange(key)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setCursor(index)
        setOpen(true)
        return
      }
      const step = e.key === 'ArrowDown' ? 1 : -1
      setCursor((c) => (c + step + options.length) % options.length)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) pick(options[cursor].key)
      else {
        setCursor(index)
        setOpen(true)
      }
    }
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setCursor(index)
          setOpen((v) => !v)
        }}
        onKeyDown={onKeyDown}
        className={`w-full flex items-center justify-between gap-3 bg-white/[0.04] border rounded-full text-sm text-[#F4F6F8] px-5 py-3 transition-colors ${
          open ? 'border-[#C9A86A]/60' : 'border-white/15 hover:border-white/30'
        }`}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#7C838C] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="menu-pop absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 bg-[#16181C] border border-white/12 rounded-2xl p-1.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          {options.map((option, i) => {
            const selected = option.key === current?.key
            return (
              <li key={option.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => pick(option.key)}
                  className={`w-full text-left flex items-center justify-between gap-3 text-sm px-4 py-2.5 rounded-xl transition-colors ${
                    i === cursor ? 'bg-white/[0.08] text-[#F4F6F8]' : 'text-[#C3C8CE]/80'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {selected && <Check size={15} className="shrink-0 text-[#C9A86A]" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
