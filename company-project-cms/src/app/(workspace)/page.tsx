import { HomePieChart } from "@/components/charts/home-piechart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RecentTask from "./_components/recent-task";
import AssignedMeTask from "./_components/assigned-me";
import MyTask from "./_components/my-task";

export default function Home() {
  return (
    <div className="p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks Card */}
        <RecentTask />

        {/* Assigned to Me Card */}
        <AssignedMeTask />

        {/* My Work Card */}
        <MyTask />
        {/* Home Pie Chart */}
        <HomePieChart />
      </div>
    </div>
  );
}
