import { CheckCircle2, CreditCard, Package, Palette, Truck, Star } from 'lucide-react'

const STAGES = [
  { id: 'paid', label: 'Paid', icon: CreditCard },
  { id: 'received', label: 'Received', icon: Package },
  { id: 'processing', label: 'In Progress', icon: Palette },
  { id: 'shipped', label: 'On its way', icon: Truck },
  { id: 'delivered', label: 'Done', icon: CheckCircle2 },
]

export function StatusStepper({ currentStatus }) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStatus)
  
  return (
    <div className="w-full py-6 px-2">
      <div className="relative flex items-center justify-between">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted-foreground/20" />
        <div 
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {/* Nodes */}
        {STAGES.map((stage, i) => {
          const Icon = stage.icon
          const isCompleted = i < currentIndex
          const isCurrent = i === currentIndex
          const isFuture = i > currentIndex

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : isCurrent 
                      ? 'border-primary bg-card text-primary ring-4 ring-primary/10 scale-110' 
                      : 'border-muted-foreground/30 bg-card text-muted-foreground/40'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="absolute -bottom-8 flex flex-col items-center whitespace-nowrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isCurrent ? 'text-primary' : isFuture ? 'text-muted-foreground/40' : 'text-muted-foreground'
                }`}>
                  {stage.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
