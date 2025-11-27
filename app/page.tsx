import { Header } from "@/components/header";
import { HeroComponent } from "@/components/hero-component";
import { TrendingOrgs } from "@/components/trending-orgs";
import { FaqComponent } from "@/components/faq";
import { Footer } from "@/components/Footer";

export default function Home() {
  return <>
    <Header />
    <HeroComponent />
    <TrendingOrgs />
    <FaqComponent />
    <Footer />
  </>;
}
