/**
 * Datos de la sección de presentación (hero). Módulo puro, sin React, para
 * poder testearlo con `node --test`.
 */

export const PERFIL = {
  nombre: 'Facundo',
  apellido: 'Chacón',
  rol: 'Full Stack Developer',
  especialidad: 'Java / React',
}

/** Filas del panel de sistema, en orden de lectura. `tono: 'ok'` marca el estado operativo. */
export const FICHA = [
  { id: 'rol', etiqueta: 'Rol', valor: PERFIL.rol },
  { id: 'stack', etiqueta: 'Stack', valor: 'Java 17 · Spring Boot · React' },
  { id: 'ubicacion', etiqueta: 'Ubicación', valor: 'Maipú, Mendoza, AR' },
  { id: 'estado', etiqueta: 'Estado', valor: 'Operativo · disponible', tono: 'ok' },
]

export const ENLACES_PERFIL = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/FacundoChacon' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/facundo-chacon-61362735a' },
]

/** Dimensiones intrínsecas reales de `public/profile.webp` (las valida un test). */
export const RETRATO = {
  src: '/profile.webp',
  width: 900,
  height: 1600,
  alt: 'Retrato de Facundo Chacón',
}

/**
 * @param {{ nombre: string, apellido: string }} perfil
 * @returns {string} "Nombre Apellido" sin espacios sobrantes
 */
export function nombreCompleto({ nombre, apellido }) {
  return [nombre, apellido].map((parte) => parte.trim()).filter(Boolean).join(' ')
}

/** Atributos de un enlace que abre en pestaña nueva sin dar acceso a `window.opener`. */
export function externalLinkProps() {
  return { target: '_blank', rel: 'noopener noreferrer' }
}
