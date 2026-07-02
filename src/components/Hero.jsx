import { ArrowRight, Sparkles, Code2, MapPin } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.06)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.04)_0%,transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="relative max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-sm text-accent-purple-light mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          Disponible para proyectos freelance
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in">
          <span className="gradient-text">Facundo Chacón</span>
        </h1>

        <div className="flex items-center justify-center gap-2 text-lg sm:text-xl text-gray-300 font-medium mb-3">
          <Code2 className="w-5 h-5 text-accent-purple" />
          <span>Desarrollador Web Freelance</span>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-sm text-gray-500 mb-6">
          <MapPin className="w-4 h-4" />
          Argentina &middot; Estudiante en UTN
        </p>

        <p className="text-gray-400 max-w-xl mx-auto mb-10 text-base leading-relaxed">
          Creo sitios web modernos, rápidos y profesionales para negocios que quieren
          crecer en internet. Stack: React, Node.js, Angular, Tailwind CSS y más.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
          <a href="#proyectos"
            className="group flex items-center gap-2 px-8 py-3.5 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl font-semibold transition-all glow-purple">
            Ver proyectos
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#contacto"
            className="flex items-center gap-2 px-8 py-3.5 border border-accent-red/30 text-accent-red hover:bg-accent-red/10 rounded-xl font-semibold transition-all">
            Contactame
          </a>
        </div>
      </div>
    </section>
  )
}
