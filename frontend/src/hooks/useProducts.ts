import { useCallback, useEffect, useState } from 'react'
import { fetchProduct, fetchProducts, NotFoundError, type Product } from '../lib/api'

type State<T> = {
  data: T | null
  loading: boolean
  error: 'network' | 'notfound' | null
}

/**
 * A cold backend can take most of a minute to answer, so `loading` is a state
 * the pages are expected to render properly — never a blank screen.
 */
function useRemote<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ data: null, loading: true, error: null })

    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({
          data: null,
          loading: false,
          error: err instanceof NotFoundError ? 'notfound' : 'network',
        })
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, retry }
}

export function useProducts() {
  const { data, loading, error, retry } = useRemote<Product[]>((s) => fetchProducts(s), [])
  return { products: data ?? [], loading, error, retry }
}

export function useProduct(id: string | undefined) {
  const { data, loading, error, retry } = useRemote<Product>(
    (s) => (id ? fetchProduct(id, s) : Promise.reject(new NotFoundError())),
    [id],
  )
  return { product: data, loading, error, retry }
}
