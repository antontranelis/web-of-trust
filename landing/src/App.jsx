import Header from './components/Header'
import Hero from './components/Hero'
import ProblemSolution from './components/ProblemSolution'
import HowItWorks from './components/HowItWorks'
import Personas from './components/Personas'
import Principles from './components/Principles'
import FAQ from './components/FAQ'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Personas />
        <Principles />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}

export default App
