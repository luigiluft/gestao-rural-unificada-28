import { PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTutorial } from '@/contexts/TutorialContext'

export const TutorialButton = () => {
  const { startTutorial, isActive } = useTutorial()

  if (isActive) return null

  return (
    <Button
      onClick={startTutorial}
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-2"
    >
      <PlayCircle className="h-4 w-4 animate-pulse text-primary" />
      <span className="font-medium">Tutorial</span>
    </Button>
  )
}