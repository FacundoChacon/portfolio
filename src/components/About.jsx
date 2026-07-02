import { GraduationCap, Code2, MapPin, Zap } from 'lucide-react'

const highlights = [
  { icon: GraduationCap, label: 'Estudiante en UTN', desc: 'Ingeniería en Sistemas de Información' },
  { icon: Code2, label: 'Full Stack en formación', desc: 'React, Node.js, Angular, Tailwind CSS' },
  { icon: MapPin, label: 'Argentina', desc: 'Disponible para trabajo remoto' },
  { icon: Zap, label: 'Freelance activo', desc: 'Proyectos para clientes reales desde 2026' },
]

export default function About() {
  return (
    <section id="sobre-mi" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,195,0.03)_0%,transparent_60%)]" />
      <div className="relative max-w-4xl mx-auto">
        <h2 className="section-title">
          Sobre <span className="gradient-text">mí</span>
        </h2>
        <p className="section-desc">
          Un poco de mi historia y lo que hago.
        </p>

        <div className="glass-hover p-8 mb-8">
          <p className="text-gray-300 leading-relaxed mb-4">
            Soy Facundo, estudiante de Ingeniería en Sistemas en la UTN y desarrollador web freelance.
            Me especializo en crear sitios web modernos, rápidos y adaptados a celulares para
            negocios que quieren crecer en internet.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Arranqué en el desarrollo web a principios de 2026 y desde entonces vengo
            sumando proyectos reales para clientes, usando tecnologías como React, Node.js,
            Angular y Tailwind CSS. Estoy en constante aprendizaje y buscando nuevos desafíos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="glass-hover p-5 text-center">
              <Icon className="w-6 h-6 text-accent-green mx-auto mb-3" />
              <p className="text-white text-sm font-semibold mb-1">{label}</p>
              <p className="text-gray-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
