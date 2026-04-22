import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function UpgradePromptCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>Pro feature</CardTitle>
        <CardDescription>
          Advanced billing controls are part of the Pro plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button>Upgrade to Pro</Button>
      </CardContent>
    </Card>
  )
}
