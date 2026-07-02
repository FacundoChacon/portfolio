import { useEffect, useRef, useState } from 'react'

const skillCategories = [
  {
    name: 'Frontend',
    skills: [
      { name: 'HTML', level: 90 },
      { name: 'CSS', level: 85 },
      { name: 'JavaScript', level: 80 },
      { name: 'React', level: 70 },
      { name: 'Angular', level: 55 },
      { name: 'Tailwind CSS', level: 85 },
    ],
  },
  {
    name: 'Backend & Herramientas',
    skills: [
      { name: 'Node.js', level: 65 },
      { name: 'Java', level: 50 },
      { name: 'Python', level: 40 },
      { name: 'MySQL', level: 60 },
      { name: 'Git', level: 70 },
      { name: 'Docker', level: 35 },
    ],
  },
]

function SkillBar({ name, level, index }) {
  const [width, setWidth] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !done.current) {
        done.current = true
        setTimeout(() => setWidth(level), 100 + index * 50)
      }
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [level, index])

  return (
    <div ref={ref} className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-gray-300 font-medium">{name}</span>
        <span className="text-xs font-mono text-gray-500">{level}%</span>
      </div>
      <div className="h-2 bg-dark-border/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-red transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export default function Skills() {
  return (
    <section id="skills" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.03)_0%,transparent_60%)]" />
      <div className="relative max-w-5xl mx-auto">
        <h2 className="section-title">
          Stack <span className="gradient-text">tecnológico</span>
        </h2>
        <p className="section-desc">
          Tecnologías que uso y nivel de experiencia en cada una.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {skillCategories.map(cat => (
            <div key={cat.name} className="glass-hover p-6">
              <h3 className="text-sm font-mono uppercase tracking-widest text-accent-purple-light mb-6">
                {'>'} {cat.name}
              </h3>
              <div>
                {cat.skills.map((skill, i) => (
                  <SkillBar key={skill.name} {...skill} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
