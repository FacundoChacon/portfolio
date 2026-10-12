/**
 * Catálogo del Configurador de Presupuestos Web.
 *
 * Fuente de verdad única de los productos (tipos de sitio y extras) que ofrece
 * el configurador, junto con su semántica de precio. Es un dato editable: cambiar
 * un precio o un texto no requiere tocar ningún componente de UI.
 *
 * Los importes son valores de referencia en ARS (ver P-01 en
 * `knowledge-base/10_preguntas_abiertas.md`) y no son vinculantes.
 *
 * @typedef {'contenido'|'tecnico'|'crecimiento'|'soporte'|'infra'} ExtraCategory
 *
 * @typedef {Object} Service
 * @property {string} id            Identificador único y estable (kebab-case).
 * @property {string} name          Nombre visible.
 * @property {string} description   Qué incluye y para quién.
 * @property {number|null} priceARS Precio de referencia en ARS; `null` si es "a cotizar".
 * @property {boolean} quotable     `true` si el precio se cotiza a medida (no suma al total).
 * @property {string} icon          Nombre del icono de lucide-react (lo resuelve la UI).
 * @property {string} [tag]         Etiqueta promocional opcional ("Más elegido", "A cotizar").
 *
 * @typedef {Object} Extra
 * @property {string} id             Identificador único y estable (kebab-case).
 * @property {string} name           Nombre visible.
 * @property {string} description    Qué incluye.
 * @property {number} priceARS       Precio de referencia en ARS; `0` para "sin costo".
 * @property {ExtraCategory} category Categoría del extra.
 * @property {boolean} recurring     `true` si es de cobro mensual.
 * @property {string} [disclaimer]   Texto legal/aclaratorio opcional.
 * @property {boolean} recommended   `true` si viene preseleccionado.
 */

/** Moneda del catálogo: todos los precios se expresan y muestran en ARS (RN-PR-01). */
export const CURRENCY = 'ARS'

/** Categorías válidas de un extra. */
/** @type {ExtraCategory[]} */
export const CATEGORIES = ['contenido', 'tecnico', 'crecimiento', 'soporte', 'infra']

/**
 * Disclaimer del extra "Hosting + Dominio" (RN-HD-02).
 * Se exporta como constante para reutilizar el texto tal cual en la UI y en el PDF.
 */
export const HOSTING_DISCLAIMER =
  'Me encargo de la gestión técnica (configuración, deploy, SSL, DNS). El costo del hosting y el dominio está a cargo del cliente y se contrata a su nombre (por una cuestión de propiedad).'

/** Tipos de sitio ofrecidos. */
/** @type {Service[]} */
export const services = [
  {
    id: 'landing',
    name: 'Landing Page',
    description:
      'Una sola página enfocada en convertir: ideal para lanzar un producto, servicio o campaña puntual.',
    priceARS: 250000,
    quotable: false,
    icon: 'Rocket',
    tag: 'Más elegido',
  },
  {
    id: 'onepage',
    name: 'One Page',
    description:
      'Todo tu negocio en una sola página con secciones y navegación por anclas.',
    priceARS: 180000,
    quotable: false,
    icon: 'Layers',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description:
      'Tienda online con catálogo, carrito y medios de pago para vender las 24 horas.',
    priceARS: 600000,
    quotable: false,
    icon: 'ShoppingCart',
  },
  {
    id: 'corporate',
    name: 'Web Corporativa',
    description:
      'Sitio institucional multipágina para empresas que necesitan transmitir confianza.',
    priceARS: 450000,
    quotable: false,
    icon: 'Building2',
  },
  {
    id: 'blog',
    name: 'Blog',
    description:
      'Sitio de contenidos con artículos, categorías y publicación periódica.',
    priceARS: 300000,
    quotable: false,
    icon: 'Newspaper',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description:
      'Muestra tu trabajo con una galería de proyectos pensada para conseguir clientes.',
    priceARS: 220000,
    quotable: false,
    icon: 'Briefcase',
  },
  {
    id: 'custom',
    name: 'Sistema a medida',
    description:
      'Una aplicación web hecha a medida para un flujo o proceso específico. Se cotiza según el alcance.',
    priceARS: null,
    quotable: true,
    icon: 'Sparkles',
    tag: 'A cotizar',
  },
]

/** Extras opcionales que se suman al servicio principal. */
/** @type {Extra[]} */
export const extras = [
  {
    id: 'seo',
    name: 'SEO inicial',
    description:
      'Optimización base de estructura, metaetiquetas y rendimiento para posicionar en Google.',
    priceARS: 120000,
    category: 'crecimiento',
    recurring: false,
    recommended: false,
  },
  {
    id: 'copy',
    name: 'Copywriting',
    description:
      'Redacción de los textos del sitio con foco en claridad y conversión.',
    priceARS: 90000,
    category: 'contenido',
    recurring: false,
    recommended: false,
  },
  {
    id: 'cms',
    name: 'CMS / Blog',
    description:
      'Panel de administración para editar tus propios contenidos sin depender de un desarrollador.',
    priceARS: 150000,
    category: 'tecnico',
    recurring: false,
    recommended: false,
  },
  {
    id: 'i18n',
    name: 'Multi-idioma',
    description: 'Sitio traducible a varios idiomas con selector de lengua.',
    priceARS: 180000,
    category: 'tecnico',
    recurring: false,
    recommended: false,
  },
  {
    id: 'clients',
    name: 'Área de clientes',
    description:
      'Acceso con registro y login para que tus clientes vean su información privada.',
    priceARS: 250000,
    category: 'tecnico',
    recurring: false,
    recommended: false,
  },
  {
    id: 'whatsapp',
    name: 'Integración WhatsApp/CRM',
    description:
      'Conexión de los formularios de contacto con WhatsApp o tu CRM para no perder leads.',
    priceARS: 80000,
    category: 'crecimiento',
    recurring: false,
    recommended: false,
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento mensual',
    description:
      'Actualizaciones, respaldos y soporte técnico continuo para que el sitio siga funcionando.',
    priceARS: 60000,
    category: 'soporte',
    recurring: true,
    recommended: false,
  },
  {
    id: 'hosting',
    name: 'Hosting + Dominio',
    description:
      'Me encargo de publicar y mantener el sitio online: configuración, deploy, SSL y DNS.',
    priceARS: 0,
    category: 'infra',
    recurring: false,
    disclaimer: HOSTING_DISCLAIMER,
    recommended: true,
  },
]
