/** Datos de la sección de proyectos (fuente única para la UI y los tests). */
export const PROYECTOS = [
  {
    title: "Tienda-Electronica",
    status: "demo",
    description:
      "E-commerce con roles ADMIN/CLIENT, carrito, checkout, panel de administración y API REST protegida con JWT.",
    tags: ["Java 17", "Spring Boot", "React 18", "Tailwind", "MySQL", "Docker"],
    image: "/project-ecommerce.webp",
    imageWidth: 1000,
    imageHeight: 474,
    repo: "https://github.com/FacundoChacon/Tienda-Electronica",
    live: "https://tiendaecommerce-electronica.netlify.app/",
  },
  {
    title: "CIMMA-Dentistry",
    status: "live",
    description:
      "Landing page responsiva para clínica dental con integración de WhatsApp, formulario de contacto y SEO. En producción.",
    tags: ["HTML5", "CSS3", "SEO", "Responsive"],
    image: "/project-dental.webp",
    imageWidth: 1000,
    imageHeight: 474,
    repo: "https://github.com/FacundoChacon/CIMMA-DENTISTRY",
    live: "https://cimmaodontologia.com",
  },
  {
    title: "Bodega",
    status: "demo",
    description:
      "Aplicación full stack CRUD con backend en Java/Spring Boot, frontend en JavaScript y base de datos MySQL.",
    tags: ["Java", "Spring Boot", "JavaScript", "MySQL"],
    image: "/project-bodega.webp",
    imageWidth: 1000,
    imageHeight: 468,
    repo: "https://github.com/FacundoChacon/Bodega",
    live: "https://bodegamaipu.netlify.app/",
  },
  {
    title: "Odontologia-Carolina",
    status: "inprogress",
    description:
      "Landing para el consultorio de Odontología Carolina Simón (endodoncia) en Mendoza, con servicios y contacto por teléfono, WhatsApp e Instagram. En desarrollo.",
    tags: ["React", "Tailwind CSS", "Vite"],
    image: "/project-odontologia-carolina.webp",
    imageWidth: 1000,
    imageHeight: 703,
    live: "https://test-odontologia-carolina.vercel.app/",
  },
  {
    title: "3-Esquinas",
    status: "inprogress",
    description:
      "Portal de donaciones full stack: frontend en React con Tailwind CSS, API y lógica de negocio en Java con Spring Boot, persistencia en MySQL y despliegue en contenedores con Docker. En desarrollo.",
    tags: ["React", "Tailwind CSS", "Java", "Spring Boot", "MySQL", "Docker"],
    image: "/project-3-esquinas.webp",
    imageWidth: 1000,
    imageHeight: 703,
    live: "https://3-esquinas-frontend.vercel.app/",
  },
]

/** Texto de cada estado (fuente única para las cards). */
export const STATUS_LABELS = {
  demo: "Demo",
  live: "En el mercado",
  inprogress: "En curso",
}

/** Perfil de GitHub (misma URL que usan Hero y Contact). */
export const GITHUB_PERFIL_URL = "https://github.com/FacundoChacon"

/** Ancla de la sección de contacto en la home. */
export const CONTACTO_ANCLA = "#contacto"
