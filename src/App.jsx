import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import { useRouteMeta } from './hooks/useRouteMeta'

const Configurador = lazy(() => import('./pages/Configurador'))

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-eva-black">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-2 border-eva-line border-t-eva-primary" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-eva-gray">Cargando…</p>
      </div>
    </div>
  )
}

export default function App() {
  useRouteMeta()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/configurador"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Configurador />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
