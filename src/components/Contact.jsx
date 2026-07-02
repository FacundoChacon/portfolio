import { Linkedin, Github, Mail, MessageCircle, Send, ArrowUp } from 'lucide-react'

const contactMethods = [
  {
    icon: Linkedin,
    label: 'LinkedIn',
    description: 'Conectemos profesionalmente',
    href: 'https://www.linkedin.com/in/facundo-chac%C3%B3n-catal%C3%A1n-61362735a',
    color: 'hover:text-accent-green border-accent-green/20 hover:border-accent-green/40',
    bg: 'hover:bg-accent-green/5',
  },
  {
    icon: Github,
    label: 'GitHub',
    description: 'Mirá mi código y proyectos',
    href: 'https://github.com/FacundoChacon',
    color: 'hover:text-white border-gray-700 hover:border-gray-500',
    bg: 'hover:bg-white/5',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    description: 'Respuesta rápida por mensaje',
    href: 'https://wa.me/542615799062',
    color: 'hover:text-accent-pink border-accent-pink/20 hover:border-accent-pink/40',
    bg: 'hover:bg-accent-pink/5',
  },
  {
    icon: Mail,
    label: 'Email',
    description: 'facundo.chacon@email.com',
    href: 'mailto:facundo.chacon@email.com',
    color: 'hover:text-accent-green border-accent-green/20 hover:border-accent-green/40',
    bg: 'hover:bg-accent-green/5',
  },
]

export default function Contact() {
  return (
    <section id="contacto" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.04)_0%,transparent_60%)]" />
      <div className="relative max-w-4xl mx-auto">
        <h2 className="section-title">
          <span className="gradient-text">Contacto</span>
        </h2>
        <p className="section-desc">
          ¿Tenés un proyecto en mente? Trabajemos juntos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {contactMethods.map(m => (
            <a key={m.label} href={m.href} target="_blank" rel="noopener noreferrer"
              className={`glass p-5 flex items-center gap-4 ${m.color} ${m.bg} transition-all duration-300 group`}>
              <div className="p-3 rounded-xl bg-dark-border/30 group-hover:scale-110 transition-transform">
                <m.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-semibold">{m.label}</p>
                <p className="text-xs text-gray-500">{m.description}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="glass p-8 text-center max-w-lg mx-auto">
          <Send className="w-8 h-8 text-accent-green mx-auto mb-4" />
          <p className="text-gray-300 font-medium mb-1">¿Prefieres que te contacte yo?</p>
          <p className="text-sm text-gray-500 mb-4">Dejame tu consulta y te respondo a la brevedad.</p>
          <a href="https://wa.me/542615799062?text=Hola%20Facundo%2C%20vi%20tu%20portfolio%20y%20quiero%20consultarte%20sobre..."
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-green/10 border border-accent-green/20 rounded-xl text-accent-green hover:bg-accent-green/20 transition-all font-medium">
            <MessageCircle className="w-4 h-4" />
            Escribime por WhatsApp
          </a>
        </div>

        <div className="mt-16 pt-8 border-t border-dark-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Facundo Chacón &mdash; Todos los derechos reservados
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/FacundoChacon" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-accent-green transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://www.linkedin.com/in/facundo-chac%C3%B3n-catal%C3%A1n-61362735a" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-accent-green transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-dark-card/50 rounded-lg text-gray-500 hover:text-accent-green hover:bg-accent-green/10 transition-all">
              <ArrowUp className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
