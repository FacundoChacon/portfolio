import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveRouteMeta } from '../data/seo'
import { applyRouteMeta } from '../utils/routeMeta'

/** Mantiene título, description y canonical del documento en sync con la ruta activa. */
export function useRouteMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    applyRouteMeta(document, resolveRouteMeta(pathname))
  }, [pathname])
}
