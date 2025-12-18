'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import {
  Grid,
  CardWrapper,
  Heading,
  Text,
  Badge,
  Button,
  Input,
} from '@/components/ui'
import { Organization, PaginatedResponse } from '@/lib/api'

interface OrganizationsClientProps {
  initialData: PaginatedResponse<Organization>
  initialPage: number
}

export function OrganizationsClient({ initialData, initialPage }: OrganizationsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<PaginatedResponse<Organization>>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(initialPage)

  // Update when URL params change
  useEffect(() => {
    const page = Number(searchParams.get('page')) || 1
    if (page !== currentPage) {
      setCurrentPage(page)
      fetchOrganizations(page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchOrganizations = async (page: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', page.toString())
      params.set('limit', '20') // 20 orgs per page as requested
      
      const response = await fetch(`/api/organizations?${params.toString()}`)
      const newData = await response.json()
      setData(newData)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/organizations?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* SEO content - only show on page 1 */}
      {currentPage === 1 && (
        <div className="max-w-3xl mx-auto mb-12 prose prose-gray dark:prose-invert">
          <p className="text-lg text-muted-foreground text-center">
            Browse through all Google Summer of Code participating organizations. 
            Discover the perfect open-source project that matches your skills and interests. 
            Our comprehensive directory includes organizations working on Python, JavaScript, 
            Machine Learning, Web Development, and many other technologies. Filter by your 
            preferred tech stack and difficulty level to find beginner-friendly projects or 
            advanced challenges.
          </p>
        </div>
      )}

      {/* Search and Filters Section */}
      <div className="space-y-6 mb-8">
        {/* Search Bar - TODO: Make functional with client component */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search organizations by name, technology, or keyword..."
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filter Tags - TODO: Make functional with state management */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            All
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Python
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            JavaScript
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Beginner Friendly
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Machine Learning
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Web Development
          </Badge>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <OrganizationsGridSkeleton />
        ) : (
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
            {data.items.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </Grid>
        )}
      </div>

      {/* Pagination Controls */}
      {data.pages > 1 && (
        <div className="flex flex-col items-center gap-6 pt-8">
          {/* Page Numbers */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(data.pages, 10) }, (_, i) => {
              // Show first 3, current page ± 2, and last 3 pages
              const pageNum = i + 1
              const shouldShow =
                pageNum <= 3 ||
                pageNum >= data.pages - 2 ||
                Math.abs(pageNum - currentPage) <= 2

              if (!shouldShow) {
                if (pageNum === 4 || pageNum === data.pages - 3) {
                  return <span key={i} className="px-2">...</span>
                }
                return null
              }

              return (
                <Button
                  key={i}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              )
            })}

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === data.pages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Organization Card Component
 */
interface OrganizationCardProps {
  org: Organization
}

function OrganizationCard({ org }: OrganizationCardProps) {
  return (
    <CardWrapper hover className="h-full flex flex-col">
      {/* Organization Logo/Icon */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {org.img_r2_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.img_r2_url}
              alt={`${org.name} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {org.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <Heading variant="small" className="line-clamp-1">
            {org.name}
          </Heading>
          <Text variant="small" className="text-muted-foreground">
            {org.total_projects} projects
          </Text>
        </div>
      </div>

      {/* Description */}
      <Text variant="muted" className="line-clamp-3 mb-4 flex-1">
        {org.description}
      </Text>

      {/* Technologies */}
      <div className="flex flex-wrap gap-2 mb-4">
        {org.technologies.slice(0, 3).map((tech) => (
          <Badge key={tech} variant="secondary" className="text-xs">
            {tech}
          </Badge>
        ))}
        {org.technologies.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{org.technologies.length - 3}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Badge variant={org.is_currently_active ? 'default' : 'secondary'}>
          {org.is_currently_active ? 'Active' : 'Inactive'}
        </Badge>
        <Button variant="ghost" size="sm" asChild>
          <a href={`/organizations/${org.slug}`}>View Details →</a>
        </Button>
      </div>
    </CardWrapper>
  )
}

/**
 * Loading Skeleton for Organizations Grid
 */
function OrganizationsGridSkeleton() {
  return (
    <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardWrapper key={i} className="h-64 animate-pulse">
          <div className="h-full bg-muted/50 rounded-md" />
        </CardWrapper>
      ))}
    </Grid>
  )
}

