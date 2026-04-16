import { Navbar } from "@/components/shared/navbar";
import { Hero } from "@/components/marketing/hero";
import { SocialProof } from "@/components/marketing/social-proof";
import { ScreenerTeaser } from "@/components/marketing/screener-teaser";
import { Features } from "@/components/marketing/features";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { Footer } from "@/components/marketing/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <ScreenerTeaser />
        <Features />
        <ComparisonTable />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
