'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Input, Button } from '@/components/ui'

interface FiltersSidebarProps {
  onFilterChange: (filters: FilterState) => void
  initialFilters?: FilterState
}

export interface FilterState {
  search: string
  year: string | null
  category: string | null
  tech: string | null
  topic: string | null
  difficulty: string | null
}

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010]
const CATEGORIES = [
  'Artificial Intelligence',
  'Data',
  'Development tools',
  'End-user applications',
  'Infrastructure & Cloud',
  'Media',
  'Science',
  'Security',
  'Web Development',
]
const DIFFICULTY_LEVELS = ['Beginner Friendly', 'Intermediate', 'Advanced']

export function FiltersSidebar({ onFilterChange, initialFilters }: FiltersSidebarProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      search: '',
      year: null,
      category: null,
      tech: null,
      topic: null,
      difficulty: null,
    }
  )

  const [expandedSections, setExpandedSections] = useState({
    firstTime: true,
    years: true,
    technologies: true,
    difficulty: true,
    categories: false,
    topics: false,
  })

  const [techSearch, setTechSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [availableTechs, setAvailableTechs] = useState<Array<{ name: string; count: number }>>([])

  // Fetch technologies
  useEffect(() => {
    fetch('/api/tech-stack?limit=100')
      .then((res) => res.json())
      .then((data: { items?: Array<{ name: string; usage_count?: number }> }) => {
        setAvailableTechs(
          (data.items || []).map((item) => ({
            name: item.name,
            count: item.usage_count || 0,
          }))
        )
      })
      .catch(console.error)
  }, [])

  const updateFilter = (key: keyof FilterState, value: string | null) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      year: null,
      category: null,
      tech: null,
      topic: null,
      difficulty: null,
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== null && v !== '')

  const filteredTechs = availableTechs.filter((tech) =>
    tech.name.toLowerCase().includes(techSearch.toLowerCase())
  )

  return (
    <div className="w-64 border-r pr-6">
      <div className="sticky top-24 space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Filters</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-1 text-xs">
              Clear all
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

      {/* First-time Organizations */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('firstTime')}
          className="flex items-center justify-between w-full text-sm font-medium"
        >
          First-time Organizations
          {expandedSections.firstTime ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.firstTime && (
          <div className="space-y-2 pl-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={false}
                onChange={() => {}}
              />
              <span className="text-sm">Show only first-time orgs (14)</span>
            </label>
          </div>
        )}
      </div>

      {/* Years - 2 Column Layout */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('years')}
          className="flex items-center justify-between w-full text-sm font-medium"
        >
          Years
          {expandedSections.years ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.years && (
          <div className="pl-2">
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 max-h-48 overflow-y-auto">
              {YEARS.map((year) => (
                <label key={year} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={filters.year === year.toString()}
                    onChange={(e) =>
                      updateFilter('year', e.target.checked ? year.toString() : null)
                    }
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Technologies */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('technologies')}
          className="flex items-center justify-between w-full text-sm font-medium"
        >
          Technologies
          {expandedSections.technologies ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.technologies && (
          <div className="space-y-2 pl-2">
            <Input
              type="search"
              placeholder="Search technologies..."
              value={techSearch}
              onChange={(e) => setTechSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredTechs.slice(0, 50).map((tech) => (
                <label key={tech.name} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={filters.tech === tech.name}
                    onChange={(e) =>
                      updateFilter('tech', e.target.checked ? tech.name : null)
                    }
                  />
                  <span className="flex-1">{tech.name}</span>
                  <span className="text-xs text-muted-foreground">({tech.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('difficulty')}
          className="flex items-center justify-between w-full text-sm font-medium"
        >
          Difficulty
          {expandedSections.difficulty ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.difficulty && (
          <div className="space-y-2 pl-2">
            {DIFFICULTY_LEVELS.map((level) => (
              <label key={level} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={filters.difficulty === level}
                  onChange={(e) =>
                    updateFilter('difficulty', e.target.checked ? level : null)
                  }
                />
                <span>{level}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full text-sm font-medium"
        >
          Categories
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="space-y-2 pl-2">
            <Input
              type="search"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {CATEGORIES.filter((cat) =>
                cat.toLowerCase().includes(categorySearch.toLowerCase())
              ).map((category) => (
                <label key={category} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={filters.category === category}
                    onChange={(e) =>
                      updateFilter('category', e.target.checked ? category : null)
                    }
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Topics */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('topics')}
          className="flex items-center justify-between w-full text-sm font-medium"
        >
          Topics
          {expandedSections.topics ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.topics && (
          <div className="space-y-2 pl-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={filters.topic === 'Security'}
                onChange={(e) =>
                  updateFilter('topic', e.target.checked ? 'Security' : null)
                }
              />
              <span>Security</span>
            </label>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

