import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ fullPage = true }) {
  return (
    <div className={`flex items-center justify-center ${fullPage ? 'fixed inset-0 z-[100] bg-background/50 backdrop-blur-sm' : 'h-32'}`}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading art...</p>
      </div>
    </div>
  )
}
