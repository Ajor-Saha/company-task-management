"use client"

import { useState } from "react"
import { Search, Bell, ChevronDown, MoreHorizontal, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RevenueChart } from "@/app/(admin)/dashboard/revenue-chart"
import { UnitSoldChart } from "@/app/(admin)/dashboard/unit-sold-chart"
import { MetricCard } from "@/app/(admin)/dashboard/metric-card"
import PStatisticsGraph from "@/app/(admin)/dashboard/PStatisticsGraph"

const softwareProducts = [
  {
    id: 1,
    name: "Adobe Creative Cloud",
    supplier: "Adobe Inc.",
    stock: 775,
    sales: 4858,
    batchTracked: "343454",
    icon: "🎨",
  },
  {
    id: 2,
    name: "Microsoft Office 365",
    supplier: "Microsoft Corp",
    stock: 888,
    sales: 1334,
    batchTracked: "5098923",
    icon: "📊",
  },
  {
    id: 3,
    name: "Zoom Pro",
    supplier: "Zoom Video Communications",
    stock: 466,
    sales: 7127,
    batchTracked: "3245672",
    icon: "🎥",
  },
  {
    id: 4,
    name: "Slack Enterprise",
    supplier: "Salesforce Inc.",
    stock: 722,
    sales: 2126,
    batchTracked: "3256477",
    icon: "💬",
  },
  {
    id: 5,
    name: "Google Workspace",
    supplier: "Google LLC",
    stock: 1200,
    sales: 5400,
    batchTracked: "987654",
    icon: "☁️",
  },
  {
    id: 6,
    name: "Adobe Photoshop",
    supplier: "Adobe Inc.",
    stock: 982,
    sales: 6142,
    batchTracked: "123987",
    icon: "🖌️",
  },
  {
    id: 7,
    name: "Trello Business Class",
    supplier: "Atlassian Inc.",
    stock: 540,
    sales: 3200,
    batchTracked: "4567890",
    icon: "📋",
  },
  {
    id: 8,
    name: "GitHub Enterprise",
    supplier: "Microsoft Corp.",
    stock: 670,
    sales: 4500,
    batchTracked: "7896543",
    icon: "🐙",
  },
  
]

export default function DashboardClient() {
  const [timeframe, setTimeframe] = useState("Last year")

  return (
    <div className="flex min-h-screen w-full flex-col">
 
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-6">
          {/* Greeting and Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Good day, Visionary Leader!</h1>
              <p className="text-muted-foreground">Here's what's happening with your store today.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{timeframe}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                    Export
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Gross Sales"
              value="$22,892"
              change={26}
              changeValue="+1.42k"
              changeLabel="today"
              trend="up"
              icon="💰"
            />
            <MetricCard
              title="Average Sales"
              value="$8,283"
              change={23}
              changeValue="+0.34k"
              changeLabel="today"
              trend="up"
              icon="📈"
            />
            <MetricCard
              title="New Sales"
              value="$1,853"
              change={-2.4}
              changeValue="+0.45"
              changeLabel="today"
              trend="down"
              icon="🆕"
            />
            <MetricCard
              title="Gross Profits"
              value="$5,239"
              change={14.4}
              changeValue="+0.5k"
              changeLabel="today"
              trend="up"
              icon="💵"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-6">Revenue vs Costs</h3>
                <RevenueChart />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-6">Unit Solds</h3>
                <UnitSoldChart />
              </CardContent>
            </Card>
          </div>

          {/* Products Table and Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-6">Sale Increase/Decrease</h3>
                <PStatisticsGraph/>
              </CardContent>
            </Card>

            <Card >
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Top Products</h3>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>Product name</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Batch tracked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {softwareProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                          </TableCell>
                          <TableCell className="font-medium flex items-center gap-2">
                            <span className="text-xl">{product.icon}</span>
                            {product.name}
                          </TableCell>
                          <TableCell>{product.supplier}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>{product.sales}</TableCell>
                          <TableCell>{product.batchTracked}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
          </div>
        </div>
      </main>
    </div>
  )
}

