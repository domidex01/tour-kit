'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('demo@stacks.app')
  const [password, setPassword] = useState('••••••••')

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Stacks</CardTitle>
          <CardDescription>Any credentials work — this is a demo.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <Link href="/" className="text-xs text-muted-foreground hover:underline">
              Back to home
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
