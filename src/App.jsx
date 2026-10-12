import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'

const Configurador = lazy(() => import('./pages/Configurador'))

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-2 border-dark-border border-t-accent-green" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-gray-400">Cargando…</p>
      </div>
    </div>
  )
}

export default function App() {
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
