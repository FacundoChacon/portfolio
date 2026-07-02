import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Metrics from './components/Metrics'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Metrics />
        <Projects />
        <Skills />
        <Testimonials />
        <Contact />
      </main>
    </>
  )
}
