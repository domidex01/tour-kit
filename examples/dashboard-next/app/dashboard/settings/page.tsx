'use client'

import { LicenseGate } from '@tour-kit/license'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LicenseDebugPanel } from '@/components/tour-kit/license-debug-panel'
import { UpgradePromptCard } from '@/components/tour-kit/upgrade-prompt-card'

function AdvancedBillingControls() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced billing</CardTitle>
        <CardDescription>
          Per-seat pricing, usage-based overage caps, and cost-center allocation.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seat-cap">Seat cap</Label>
          <Input id="seat-cap" type="number" defaultValue={25} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost-center">Cost center</Label>
          <Input id="cost-center" defaultValue="R&D" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your profile, notifications, billing, and integrations.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your name and contact email.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" defaultValue="Demo User" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" type="email" defaultValue="demo@stacks.app" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose when Stacks should interrupt you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { id: 'n-mentions', label: 'Mentions', sub: 'When a teammate @mentions you' },
                { id: 'n-digest', label: 'Weekly digest', sub: 'Summary every Monday' },
                { id: 'n-billing', label: 'Billing alerts', sub: 'Invoices and receipts' },
              ].map((opt) => (
                <div key={opt.id} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={opt.id}>{opt.label}</Label>
                    <div className="text-xs text-muted-foreground">{opt.sub}</div>
                  </div>
                  <Switch id={opt.id} defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription>You are on the Starter plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Upgrade to Pro</Button>
            </CardContent>
          </Card>

          <LicenseGate require="pro" fallback={<UpgradePromptCard />}>
            <AdvancedBillingControls />
          </LicenseGate>

          <LicenseDebugPanel />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect Stacks to the tools you already use.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {['Slack', 'Linear', 'GitHub', 'Figma'].map((name) => (
                <div key={name} className="flex items-center justify-between rounded-md border p-3">
                  <div className="font-medium">{name}</div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
