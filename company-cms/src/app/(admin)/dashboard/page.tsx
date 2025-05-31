"use client"

import { useState } from "react"
import { Search, Bell, ChevronDown, MoreHorizontal, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RevenueChart } from "@/app/(admin)/dashboard/_components/revenue-chart"
import { UnitSoldChart } from "@/app/(admin)/dashboard/_components/unit-sold-chart"
import { MetricCard } from "@/app/(admin)/dashboard/_components/metric-card"
import PStatisticsGraph from "@/app/(admin)/dashboard/_components/PStatisticsGraph"
import { softwareProducts, dashboardMetrics } from './_components/data';


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


 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {dashboardMetrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
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


