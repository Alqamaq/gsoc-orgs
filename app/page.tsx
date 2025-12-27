import { Header } from "@/components/header";
import { HeroComponent } from "@/components/hero-component";
import { TrendingOrgs } from "@/components/trending-orgs";
import { FaqComponent } from "@/components/faq";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import { SITE_URL, getFullUrl } from "@/lib/constants";

// Force revalidation to ensure footer links stay updated
export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "Home | Explore Google Summer of Code Organizations",
  description:
    "Find and explore the best Google Summer of Code (GSoC) organizations for 2026. Browse by programming language, difficulty level, and project type. Start your open-source journey today!",
  keywords: [
    "GSoC 2026",
    "Google Summer of Code organizations",
    "open source projects for students",
    "beginner friendly coding projects",
    "summer coding internship",
    "student developer programs",
    "Python GSoC projects",
    "JavaScript open source",
    "machine learning projects GSoC",
  ],
  openGraph: {
    title: "GSoC Organizations Explorer | Find Your Perfect Project",
    description:
      "Discover 200+ Google Summer of Code organizations. Filter by tech stack, difficulty, and find beginner-friendly projects for GSoC 2026.",
    url: SITE_URL,
    type: "website",
    siteName: "GSoC Organizations Guide",
    // TODO: Replace with proper OG image (1200x630px) at /og.webp for better social sharing
    images: [
      {
        url: `${SITE_URL}/favicon.ico`,
        width: 512,
        height: 512,
        alt: "GSoC Organizations Guide",
      },
    ],
  },
  twitter: {
    // Using "summary" instead of "summary_large_image" since favicon is square
    // TODO: Switch to "summary_large_image" when proper OG image (1200x630px) is available
    card: "summary",
    title: "GSoC Organizations Explorer | Find Your Perfect Project",
    description:
      "Discover 200+ Google Summer of Code organizations. Filter by tech stack, difficulty, and find beginner-friendly projects for GSoC 2026.",
    images: [`${SITE_URL}/favicon.ico`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GSoC Organizations Explorer",
    description:
      "Explore and discover Google Summer of Code participating organizations, projects, and opportunities for student developers.",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${getFullUrl('/organizations')}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <HeroComponent />
      <TrendingOrgs />
      <FaqComponent />
      <Footer />
    </>
  );
}
