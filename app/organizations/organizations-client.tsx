'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { Organization, PaginatedResponse } from '@/lib/api'
import { FiltersSidebar, FilterState } from './filters-sidebar'

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
  
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('q') || '',
    year: searchParams.get('year') || null,
    category: searchParams.get('category') || null,
    tech: searchParams.get('tech') || null,
    topic: searchParams.get('topic') || null,
    difficulty: searchParams.get('difficulty') || null,
  })

  useEffect(() => {
    const newFilters: FilterState = {
      search: searchParams.get('q') || '',
      year: searchParams.get('year') || null,
      category: searchParams.get('category') || null,
      tech: searchParams.get('tech') || null,
      topic: searchParams.get('topic') || null,
      difficulty: searchParams.get('difficulty') || null,
    }
    setFilters(newFilters)
  }, [searchParams])

  useEffect(() => {
    const page = Number(searchParams.get('page')) || 1
    if (page !== currentPage) {
      setCurrentPage(page)
      fetchOrganizations(page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchOrganizations = useCallback(async (page: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (filters.search) params.set('q', filters.search)
      if (filters.category) params.set('category', filters.category)
      if (filters.tech) params.set('tech', filters.tech)
      if (filters.year) params.set('year', filters.year)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.topic) params.set('topic', filters.topic)
      
      const response = await fetch(`/api/organizations?${params.toString()}`)
      const newData = await response.json()
      setData(newData)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchOrganizations(1)
    setCurrentPage(1)
  }, [filters, fetchOrganizations])

  const handlePageChange = (page: number) => {
    updateURLParams({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    updateURLParams({ ...newFilters, page: 1 })
  }

  const updateURLParams = (updates: Partial<FilterState> & { page?: number }) => {
    const params = new URLSearchParams()
    const page = updates.page || currentPage
    if (page > 1) params.set('page', page.toString())
    const filterUpdates = updates as Partial<FilterState>
    if (filterUpdates.search) params.set('q', filterUpdates.search)
    if (filterUpdates.category) params.set('category', filterUpdates.category)
    if (filterUpdates.tech) params.set('tech', filterUpdates.tech)
    if (filterUpdates.year) params.set('year', filterUpdates.year)
    if (filterUpdates.topic) params.set('topic', filterUpdates.topic)
    if (filterUpdates.difficulty) params.set('difficulty', filterUpdates.difficulty)
    router.push(`/organizations?${params.toString()}`)
  }

  const removeFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: key === 'search' ? '' : null }
    handleFilterChange(newFilters)
  }

  const activeFilters = [
    filters.year && { key: 'year', label: filters.year, value: filters.year },
    filters.category && { key: 'category', label: filters.category, value: filters.category },
    filters.tech && { key: 'tech', label: filters.tech, value: filters.tech },
    filters.topic && { key: 'topic', label: filters.topic, value: filters.topic },
    filters.difficulty && { key: 'difficulty', label: filters.difficulty, value: filters.difficulty },
  ].filter(Boolean) as Array<{ key: keyof FilterState; label: string; value: string }>

  return (
    <div className="flex">
      {/* Sidebar - Fixed left, 280px width */}
      <aside className="hidden lg:block w-[280px] shrink-0 border-r border-[#E5E7EB] bg-white fixed top-20 lg:top-24 left-0 h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] overflow-y-auto">
        <FiltersSidebar onFilterChange={handleFilterChange} initialFilters={filters} />
      </aside>

      {/* Main Content - with left margin for sidebar */}
      <div className="flex-1 lg:ml-[280px]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="text-center mb-6">
            <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-500 rounded-full mb-2">
              GSoC 2026
            </span>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">All Organizations</h1>
            <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
              Explore all Google Summer of Code participating organizations. Filter by 
              technology, difficulty level, and find the perfect match for your skills and 
              interests.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search organizations by name, technology, or keyword..."
              className="pl-10 h-11 text-sm rounded-xl border border-gray-200 bg-white"
              value={filters.search}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Filter Chips Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                !filters.year && !filters.tech && !filters.category && !filters.difficulty
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleFilterChange({ ...filters, year: null, tech: null, category: null, difficulty: null })}
            >
              All
            </button>
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                filters.tech === 'Python'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleFilterChange({ ...filters, tech: filters.tech === 'Python' ? null : 'Python' })}
            >
              Python
            </button>
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                filters.tech === 'JavaScript'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleFilterChange({ ...filters, tech: filters.tech === 'JavaScript' ? null : 'JavaScript' })}
            >
              JavaScript
            </button>
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                filters.difficulty === 'Beginner Friendly'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleFilterChange({ ...filters, difficulty: filters.difficulty === 'Beginner Friendly' ? null : 'Beginner Friendly' })}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-500">🌱</span>
                Beginner Friendly
              </span>
            </button>
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                filters.category === 'Artificial Intelligence'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleFilterChange({ ...filters, category: filters.category === 'Artificial Intelligence' ? null : 'Artificial Intelligence' })}
            >
              Machine Learning
            </button>
            {activeFilters.length > 0 && (
              <button
                className="px-2 py-1.5 text-[13px] text-gray-400 hover:text-gray-600"
                onClick={() => handleFilterChange({
                  search: '',
                  year: null,
                  category: null,
                  tech: null,
                  topic: null,
                  difficulty: null,
                })}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Active Filters as Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full cursor-pointer hover:bg-gray-200"
                  onClick={() => removeFilter(filter.key)}
                >
                  {filter.label}
                  <X className="h-3 w-3" />
                </span>
              ))}
            </div>
          )}

          {/* Results Count */}
          {/* <p className="text-sm text-gray-500 mb-6">
            Showing {data.total} organizations
          </p> */}

          {/* Organizations Grid */}
          <div className="mb-8">
            {isLoading ? (
              <OrganizationsGridSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.items.map((org) => (
                  <OrganizationCard key={org.id} org={org} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex flex-col items-center gap-3 py-6 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="text-sm"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={i}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className="min-w-[36px] text-sm"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {data.pages > 7 && <span className="px-2 text-gray-400">...</span>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === data.pages || isLoading}
                  className="text-sm"
                >
                  Next
                </Button>
              </div>
              <p className="text-sm text-gray-500">Page {currentPage} of {data.pages}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Organization Card - Matching mockup design
 */
interface OrganizationCardProps {
  org: Organization
}

function OrganizationCard({ org }: OrganizationCardProps) {
  return (
    <a 
      href={`/organizations/${org.slug}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Header with Logo */}
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {org.img_r2_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.img_r2_url}
              alt={`${org.name} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-lg font-semibold text-gray-400">
              {org.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-0.5">
            {org.name}
          </h3>
          <p className="text-sm text-gray-500">
            {org.total_projects} projects
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
        {org.description}
      </p>

      {/* Bottom Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {org.active_years && org.active_years.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            {org.active_years[org.active_years.length - 1]}
          </span>
        )}
        {org.category && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
            {org.category}
          </span>
        )}
        {org.technologies && org.technologies.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {org.technologies[0]}
          </span>
        )}
      </div>
    </a>
  )
}

function OrganizationsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
          <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 rounded-lg bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
