import { Card } from "@/components/ui/card"
import { TutorialSelector } from "@/components/Tutorial/TutorialSelector"

const Tutorial = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tutoriais Interativos</h1>
        <p className="text-muted-foreground mt-2">
          Aprenda a usar o sistema com nossos tutoriais guiados passo a passo
        </p>
      </div>

      <Card className="p-6">
        <TutorialSelector />
      </Card>
    </div>
  )
}

export default Tutorial
