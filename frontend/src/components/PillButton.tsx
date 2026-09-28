import { ChevronsRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type Props = {
  label: string
  /** Route to open. External addresses go to `href` instead. */
  to?: string
  href?: string
}

const SHELL =
  'group w-full sm:w-auto justify-center sm:justify-start rounded-full bg-white/[0.07] border border-white/12 px-1.5 py-1.5 pr-5 flex items-center gap-3 hover:bg-white/[0.12] hover:border-[#C9A86A]/40 transition-colors duration-300'

function Inner({ label }: { label: string }) {
  return (
    <>
      <span className="bg-[#F4F6F8] rounded-full p-2 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
        <ChevronsRight size={14} className="text-[#0C0D10]" />
      </span>
      <span className="text-sm text-[#F4F6F8]">{label}</span>
    </>
  )
}

/**
 * This used to render a bare `<button>` with no handler — it looked like a
 * call to action and did nothing when clicked. It now always leads somewhere:
 * a route by default, an external address through `href`.
 */
export default function PillButton({ label, to = '/catalog', href }: Props) {
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={SHELL}>
        <Inner label={label} />
      </a>
    )
  }

  return (
    <Link to={to} className={SHELL}>
      <Inner label={label} />
    </Link>
  )
}
