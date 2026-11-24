/**
 * Datos y lógica de la sección de contacto (puro: sin React ni `import.meta.env`,
 * para poder importarlo desde `node --test`).
 */

export const DEFAULT_CONTACT_EMAIL = 'chaconfacu2006@gmail.com'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Devuelve la dirección configurada (recortada) si es válida; si no, el respaldo.
 * @param {unknown} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function resolveContactEmail(value, fallback = DEFAULT_CONTACT_EMAIL) {
  if (typeof value !== 'string') return fallback
  const email = value.trim()
  return EMAIL_PATTERN.test(email) ? email : fallback
}

/**
 * Canales de contacto en orden de presentación.
 * @param {string} email
 * @returns {{ id: 'email'|'github'|'linkedin', label: string, value: string, href: string }[]}
 */
export function buildContactChannels(email) {
  return [
    { id: 'email', label: 'Email', value: email, href: `mailto:${email}` },
    {
      id: 'github',
      label: 'GitHub',
      value: 'github.com/FacundoChacon',
      href: 'https://github.com/FacundoChacon',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      value: 'in/facundo-chacon-61362735a',
      href: 'https://www.linkedin.com/in/facundo-chacon-61362735a',
    },
  ]
}

/** @param {string} href */
export function isExternalHref(href) {
  return /^https?:\/\//i.test(href)
}

/**
 * Atributos de enlace: los externos abren pestaña nueva sin acceso a la ventana de origen.
 * @param {string} href
 * @returns {{ target?: string, rel?: string }}
 */
export function channelLinkProps(href) {
  return isExternalHref(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

/** @param {number} index posición base 0 @returns {string} p. ej. `CH-01` */
export function channelCode(index) {
  return `CH-${String(index + 1).padStart(2, '0')}`
}
