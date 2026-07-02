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

      <div className="relative max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="flex justify-center md:justify-end animate-fade-in">
          <div className="relative">
            <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-accent-purple to-accent-red p-[3px] shadow-2xl shadow-accent-purple/20">
              <div className="w-full h-full rounded-full overflow-hidden bg-dark">
                <div className="duotone-wrap w-full h-full">
                  <img
                    src="/profile.jpeg"
                    alt="Facundo Chacón"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 glass px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="text-xs text-gray-300 font-medium">Disponible</span>
            </div>
          </div>
        </div>

        <div className="text-center md:text-left animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-sm text-accent-purple-light mb-6">
            <Sparkles className="w-4 h-4" />
            Freelance
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4">
            <span className="gradient-text">Facundo Chacón</span>
          </h1>

          <div className="flex items-center justify-center md:justify-start gap-2 text-lg text-gray-300 font-medium mb-3">
            <Code2 className="w-5 h-5 text-accent-purple" />
            <span>Desarrollador Web Freelance</span>
          </div>

          <p className="flex items-center justify-center md:justify-start gap-1.5 text-sm text-gray-500 mb-5">
            <MapPin className="w-4 h-4" />
            Argentina &middot; Estudiante en UTN
          </p>

          <p className="text-gray-400 max-w-md mb-8 text-base leading-relaxed">
            Creo sitios web modernos, rápidos y profesionales para negocios que quieren
            crecer en internet.
          </p>

          <div className="flex flex-col sm:flex-row items-center md:items-start gap-4">
            <a href="#proyectos"
              className="group flex items-center gap-2 px-7 py-3 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl font-semibold transition-all glow-purple">
              Ver proyectos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#contacto"
              className="flex items-center gap-2 px-7 py-3 border border-accent-red/30 text-accent-red hover:bg-accent-red/10 rounded-xl font-semibold transition-all">
              Contactame
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
