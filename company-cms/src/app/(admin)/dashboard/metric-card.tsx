import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: number
  changeValue: string
  changeLabel: string
  trend: "up" | "down"
  icon: string
}

export function MetricCard({ title, value, change, changeValue, changeLabel, trend, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="flex items-center mt-2">
          <div className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
            <span className="font-medium">{Math.abs(change)}%</span>
          </div>
          <span className="text-muted-foreground text-sm ml-2">
            {changeValue} {changeLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

