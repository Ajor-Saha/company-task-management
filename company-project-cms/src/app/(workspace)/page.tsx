
import RecentTask from "./_components/recent-task";
import AssignedMeTask from "./_components/assigned-me";
import MyTask from "./_components/my-task";
import { HomePieChart } from "@/components/charts/home-piechart";
import { HomeAreaChart } from "@/components/charts/area-chat";
import { AppBarChart } from "@/components/charts/bar-chart";

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

        {/* Pie Chart */}
        <HomePieChart />
        {/*Bar Chart */}
        <AppBarChart />
      </div>
    </div>
  );
}
