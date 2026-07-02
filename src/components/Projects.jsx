import { ExternalLink, Github } from 'lucide-react'

const projects = [
  {
    title: 'Cimma Odontología',
    description: 'Sitio web profesional para consultorio odontológico con diseño moderno, servicios, equipo y contacto.',
    tags: ['React', 'Tailwind CSS', 'Node.js'],
    link: 'https://cimmaodontologia.com',
    gradient: 'from-accent-purple via-purple-600 to-accent-red',
    status: 'Producción',
    placeholder: 'C',
  },
  {
    title: 'Ferretería Demo 1',
    description: 'Landing page demo para ferretería con catálogo visual y enlace directo a WhatsApp.',
    tags: ['HTML', 'CSS', 'JavaScript'],
    link: 'https://imaginative-palmier-c84960.netlify.app',
    gradient: 'from-blue-700 via-accent-purple to-accent-red',
    status: 'Demo',
    placeholder: 'F1',
  },
  {
    title: 'Ferretería Demo 2',
    description: 'Sitio web demo para ferretería con galería de productos y formulario de contacto.',
    tags: ['HTML', 'CSS', 'JavaScript'],
    link: 'https://admirable-monstera-aedc63.netlify.app',
    gradient: 'from-accent-purple-dark via-purple-800 to-accent-red-dark',
    status: 'Demo',
    placeholder: 'F2',
  },
]

export default function Projects() {
  return (
    <section id="proyectos" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.03)_0%,transparent_60%)]" />
      <div className="relative max-w-6xl mx-auto">
        <h2 className="section-title">
          Proyectos <span className="gradient-text">recientes</span>
        </h2>
        <p className="section-desc">
          Trabajos realizados para clientes y demos que muestran mi estilo de desarrollo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((p) => (
            <a key={p.title} href={p.link} target="_blank" rel="noopener noreferrer"
              className="group glass-hover p-[1px] rounded-2xl overflow-hidden">
              <div className="bg-dark-card rounded-2xl h-full flex flex-col relative">
                <div className={`h-28 bg-gradient-to-br ${p.gradient} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="text-5xl font-black text-white/30 tracking-tight select-none">
                    {p.placeholder}
                  </span>
                  <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3 text-white/70" />
                    <span className="text-[10px] text-white/70 font-medium">Visitar</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-white group-hover:text-accent-purple-light transition-colors mb-2">
                    {p.title}
                  </h3>

                  <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">
                    {p.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {p.tags.map(t => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${
                      p.status === 'Producción'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
