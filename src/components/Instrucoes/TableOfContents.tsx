import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronDown } from 'lucide-react'

export interface InstructionSection {
  id: string
  title: string
  description: string
  subsections?: {
    id: string
    title: string
    content: React.ReactNode
  }[]
  content: React.ReactNode
}

interface TableOfContentsProps {
  sections: InstructionSection[]
  title: string
  subtitle: string
}

export const TableOfContents = ({ sections, title, subtitle }: TableOfContentsProps) => {
  const [activeSection, setActiveSection] = useState<string>('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id)
      }))

      const currentSection = sectionElements.find(({ element }) => {
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.top <= 100 && rect.bottom >= 100
      })

      if (currentSection) {
        setActiveSection(currentSection.id)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">{title}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Índice</h2>
            <nav className="space-y-2">
              {sections.map((section, index) => (
                <div key={section.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start text-left hover:bg-accent ${
                      activeSection === section.id ? 'bg-accent text-accent-foreground' : ''
                    }`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <Badge variant="outline" className="mr-2 min-w-[24px] h-5">
                      {index + 1}
                    </Badge>
                    <span className="truncate">{section.title}</span>
                  </Button>
                  
                  {section.subsections && (
                    <div className="ml-8 space-y-1 mt-1">
                      {section.subsections.map((subsection) => (
                        <Button
                          key={subsection.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left text-xs hover:bg-accent"
                          onClick={() => scrollToSection(subsection.id)}
                        >
                          <span className="truncate">{subsection.title}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <Badge className="min-w-[32px] h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                    <p className="text-muted-foreground mt-2">{section.description}</p>
                  </div>
                  {section.subsections && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(section.id)}
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="prose prose-slate max-w-none dark:prose-invert">
                  {section.content}
                </div>

                {/* Subsections */}
                {section.subsections && expandedSections.has(section.id) && (
                  <div className="mt-8 space-y-6">
                    {section.subsections.map((subsection) => (
                      <div key={subsection.id} id={subsection.id} className="scroll-mt-20">
                        <h3 className="text-xl font-semibold mb-4 text-foreground border-b pb-2">
                          {subsection.title}
                        </h3>
                        <div className="prose prose-slate max-w-none dark:prose-invert">
                          {subsection.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}