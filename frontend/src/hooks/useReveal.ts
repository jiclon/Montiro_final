import { useEffect, useRef, useState } from 'react'

/**
 * Generic scroll-into-view flag. Flips `inView` on the first intersection and
 * then disconnects, so every section animates in exactly once.
 *
 *   const { ref, inView } = useReveal()
 *   <div ref={ref} className={`hero-anim ${inView ? 'hero-fade' : ''}`}>
 */
export default function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}
