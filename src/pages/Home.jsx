import SiteNav from '../components/SiteNav'
import Hero from '../components/Hero'
import About from '../components/About'
import Projects from '../components/Projects'
import Stack from '../components/Stack'
import Testimonials from '../components/Testimonials'
import Contact from '../components/Contact'

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="relative min-h-screen overflow-x-hidden bg-dark">
        <Hero />
        <About />
        <Projects />
        <Stack />
        <Testimonials />
        <Contact />
      </main>
    </>
  )
}
