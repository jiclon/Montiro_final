import Hero from '../components/Hero'
import Featured from '../components/Featured'
import Story from '../components/Story'
import Steps from '../components/Steps'
import Quote from '../components/Quote'
import CTA from '../components/CTA'

export default function Home() {
  return (
    <>
      <Hero />

      {/* The dial has opened; this section is painted its white. */}
      <Featured />

      {/* Dark curtain: everything after slides over as one flat black sheet —
          no radius, border or shadow. */}
      <div className="relative z-20 bg-[#0C0D10]">
        <Story />
        <Steps />
        <Quote />
        <CTA />
      </div>
    </>
  )
}
