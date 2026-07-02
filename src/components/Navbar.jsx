import { Github, Linkedin, Download, Menu, X } from 'lucide-react'
import { useState } from 'react'

const socialLinks = [
  { href: 'https://github.com/FacundoChacon', icon: Github, label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/facundo-chac%C3%B3n-catal%C3%A1n-61362735a', icon: Linkedin, label: 'LinkedIn' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: '#proyectos', label: 'Proyectos' },
    { href: '#skills', label: 'Stack' },
    { href: '#contacto', label: 'Contacto' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-xl border-b border-dark-border/40 shadow-lg shadow-black/20">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="#" className="text-lg font-black gradient-text">
          FC<span className="text-white/20">_</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-accent-purple-light transition-colors">
              {l.label}
            </a>
          ))}
          <span className="w-px h-4 bg-dark-border/60" />
          {socialLinks.map(({ href, icon: Icon, label }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-accent-purple transition-colors" aria-label={label}>
              <Icon className="w-4 h-4" />
            </a>
          ))}
          <a href="https://wa.me/542615799062" target="_blank" rel="noopener noreferrer"
            className="text-gray-500 hover:text-green-400 transition-colors" aria-label="WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
          <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple/10 border border-accent-purple/20 rounded-lg text-xs text-accent-purple hover:bg-accent-purple/20 transition-all font-medium">
            <Download className="w-3.5 h-3.5" />
            CV
          </a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-400">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-dark-border/50 bg-dark/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="block text-gray-300 hover:text-accent-purple-light transition-colors">
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2 border-t border-dark-border/30">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-accent-purple transition-colors" aria-label={label}>
                  <Icon className="w-5 h-5" />
                </a>
              ))}
              <a href="https://wa.me/542615799062" target="_blank" rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-green-400 transition-colors" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
