import { useEffect, useState, useRef } from 'react'
import { Briefcase, Code2, Calendar, Users } from 'lucide-react'

const stats = [
  { icon: Briefcase, value: 3, suffix: '', label: 'Proyectos realizados', color: 'from-accent-purple to-accent-purple-light' },
  { icon: Code2, value: 12, suffix: '', label: 'Tecnologías en mi stack', color: 'from-accent-red to-accent-red-light' },
  { icon: Calendar, value: 2026, suffix: '', label: 'Inicio como freelance', color: 'from-accent-purple-light to-accent-purple' },
  { icon: Users, value: 1, suffix: '+', label: 'Clientes satisfechos', color: 'from-accent-red-light to-accent-red' },
]

function Counter({ to, suffix, duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const counted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true
        const start = performance.now()
        const from = 0

        function animate(now) {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(from + (to - from) * eased))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.3 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [to, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function Metrics() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, value, suffix, label, color }) => (
            <div key={label} className="glass-hover p-6 text-center group">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl md:text-4xl font-black text-white mb-1 font-mono">
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
