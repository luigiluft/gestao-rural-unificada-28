import { useState } from 'react'
import { PlayCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTutorial } from '@/contexts/TutorialContext'
import { TutorialSelector } from './TutorialSelector'

export const TutorialButton = () => {
  const { isActive } = useTutorial()
  const [isOpen, setIsOpen] = useState(false)

  if (isActive) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-2"
        >
          <PlayCircle className="h-4 w-4 animate-pulse text-primary" />
          <span className="font-medium">Tutoriais</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-4" 
        side="right" 
        align="start"
        sideOffset={8}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Tutoriais Disponíveis</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <TutorialSelector onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}