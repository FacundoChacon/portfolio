/**
 * Catálogo del Configurador Web.
 *
 * Fuente de verdad única de los productos (tipos de sitio y extras) que ofrece
 * el configurador. Es un dato editable: cambiar un texto o agregar un ítem no
 * requiere tocar ningún componente de UI.
 *
 * El catálogo **no expone precios**: el configurador arma una solicitud de
 * presupuesto a medida y el precio se confirma por email (ver
 * `knowledge-base/10_preguntas_abiertas.md` §P-01).
 *
 * @typedef {'contenido'|'tecnico'|'crecimiento'|'soporte'|'infra'} ExtraCategory
 *
 * @typedef {Object} Service
 * @property {string} id            Identificador único y estable (kebab-case).
 * @property {string} name          Nombre visible.
 * @property {string} description   Qué incluye y para quién.
 * @property {string} icon          Nombre del icono de lucide-react (lo resuelve la UI).
 * @property {string} [tag]         Etiqueta promocional opcional ("Más elegido").
 *
 * @typedef {Object} Extra
 * @property {string} id             Identificador único y estable (kebab-case).
 * @property {string} name           Nombre visible.
 * @property {string} description    Qué incluye.
 * @property {ExtraCategory} category Categoría del extra.
 * @property {string} [disclaimer]   Texto legal/aclaratorio opcional.
 * @property {boolean} recommended   `true` si viene preseleccionado.
 */

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
    icon: 'Rocket',
    tag: 'Más elegido',
  },
  {
    id: 'onepage',
    name: 'One Page',
    description:
      'Todo tu negocio en una sola página con secciones y navegación por anclas.',
    icon: 'Layers',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description:
      'Tienda online con catálogo, carrito y medios de pago para vender las 24 horas.',
    icon: 'ShoppingCart',
  },
  {
    id: 'corporate',
    name: 'Web Corporativa',
    description:
      'Sitio institucional multipágina para empresas que necesitan transmitir confianza.',
    icon: 'Building2',
  },
  {
    id: 'blog',
    name: 'Blog',
    description:
      'Sitio de contenidos con artículos, categorías y publicación periódica.',
    icon: 'Newspaper',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description:
      'Muestra tu trabajo con una galería de proyectos pensada para conseguir clientes.',
    icon: 'Briefcase',
  },
  {
    id: 'custom',
    name: 'Sistema a medida',
    description:
      'Una aplicación web hecha a medida para un flujo o proceso específico. Se cotiza según el alcance.',
    icon: 'Sparkles',
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
    category: 'crecimiento',
    recommended: false,
  },
  {
    id: 'copy',
    name: 'Copywriting',
    description:
      'Redacción de los textos del sitio con foco en claridad y conversión.',
    category: 'contenido',
    recommended: false,
  },
  {
    id: 'cms',
    name: 'CMS / Blog',
    description:
      'Panel de administración para editar tus propios contenidos sin depender de un desarrollador.',
    category: 'tecnico',
    recommended: false,
  },
  {
    id: 'i18n',
    name: 'Multi-idioma',
    description: 'Sitio traducible a varios idiomas con selector de lengua.',
    category: 'tecnico',
    recommended: false,
  },
  {
    id: 'clients',
    name: 'Área de clientes',
    description:
      'Acceso con registro y login para que tus clientes vean su información privada.',
    category: 'tecnico',
    recommended: false,
  },
  {
    id: 'whatsapp',
    name: 'Integración WhatsApp/CRM',
    description:
      'Conexión de los formularios de contacto con WhatsApp o tu CRM para no perder leads.',
    category: 'crecimiento',
    recommended: false,
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento mensual',
    description:
      'Actualizaciones, respaldos y soporte técnico continuo para que el sitio siga funcionando.',
    category: 'soporte',
    recommended: false,
  },
  {
    id: 'hosting',
    name: 'Hosting + Dominio',
    description:
      'Me encargo de publicar y mantener el sitio online: configuración, deploy, SSL y DNS.',
    category: 'infra',
    disclaimer: HOSTING_DISCLAIMER,
    recommended: true,
  },
]
