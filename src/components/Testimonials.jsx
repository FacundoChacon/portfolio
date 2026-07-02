import { Star, MessageCircle } from 'lucide-react'

const testimonials = [
  {
    name: 'María Morna González',
    role: 'Psicóloga',
    text: 'Facundo me ayudó a crear mi página web profesional. Muy buena comunicación y resultados impecables.',
    rating: 5,
  },
  {
    name: 'Cliente Ferretería',
    role: 'Comercio local',
    text: 'Quedé satisfecho con el trabajo. Rápido, prolijo y se tomó el tiempo de entender lo que necesitaba.',
    rating: 5,
  },
  {
    name: 'Próximo cliente',
    role: '—',
    text: '¿El próximo testimonio podría ser el tuyo? Estoy abierto a nuevos proyectos.',
    rating: null,
    placeholder: true,
  },
]

export default function Testimonials() {
  return (
    <section id="testimonios" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,110,255,0.03)_0%,transparent_60%)]" />
      <div className="relative max-w-5xl mx-auto">
        <h2 className="section-title">
          <span className="gradient-text">Testimonios</span>
        </h2>
        <p className="section-desc">
          Lo que dicen las personas con las que trabajé.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className={`glass-hover p-6 flex flex-col ${t.placeholder ? 'border-dashed border-accent-green/20' : ''}`}>
              {t.placeholder ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <MessageCircle className="w-8 h-8 text-accent-green/40 mb-3" />
                  <p className="text-gray-500 text-sm italic mb-3">{t.text}</p>
                  <a href="#contacto" className="text-xs text-accent-green hover:text-accent-pink transition-colors font-medium">
                    Trabajemos juntos &rarr;
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent-green text-accent-green" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-4 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="border-t border-dark-border/30 pt-3">
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
