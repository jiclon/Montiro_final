import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import AdminShell from './AdminShell'
import Login from './Login'
import AdminProducts from './AdminProducts'
import AdminOrders from './AdminOrders'

/**
 * Everything under /admin. No shop chrome, no smooth scrolling — and no
 * screen at all until there is a token.
 *
 * The guard here is only about what to render: the real protection is the
 * backend refusing every write without a valid Bearer token.
 */
export default function Admin() {
  const { signedIn } = useAuth()

  if (!signedIn) return <Login />

  return (
    <AdminShell>
      <Routes>
        <Route index element={<Navigate to="products" replace />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="login" element={<Navigate to="/admin/products" replace />} />
        <Route path="*" element={<Navigate to="/admin/products" replace />} />
      </Routes>
    </AdminShell>
  )
}
