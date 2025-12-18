import { ReactNode } from "react";
import { Header } from "@/components/header";

interface OrganizationsLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for all /organizations/* routes
 * This wraps:
 * - /organizations (with pagination)
 * - /organizations/[slug]
 * - /organizations/[slug]/projects
 * etc.
 * 
 * Note: Canonical tags and SEO metadata are handled in individual page.tsx files
 * for proper canonical URL management across paginated pages
 */
export default function OrganizationsLayout({
  children,
}: OrganizationsLayoutProps) {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - same across all pages */}
      <Header />
      
      {/* Main content area - Full height, no padding */}
      {/* pt-20 accounts for fixed header height */}
      <main className="flex-1 pt-20 lg:pt-24 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

