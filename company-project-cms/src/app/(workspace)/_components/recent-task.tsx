import { CalendarClock, Clipboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { recentTasks } from "@/constants";

const RecentTask = () => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Clipboard className="h-5 w-5 text-primary" />
          <CardTitle>Recent Tasks</CardTitle>
        </div>
        <CardDescription>Your latest assigned tasks</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow px-6 pb-4">
        <div className="space-y-0">
          {recentTasks.slice(0, 5).map((task, index) => (
            <div key={task.id}>
              <div className="flex items-center py-3 group hover:bg-muted/40 px-2 rounded-md transition-colors">
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm font-medium group-hover:text-primary truncate transition-colors">{task.title}</p>
                  </div>
                </div>
                <Badge
                  variant={
                    task.status === "Pending"
                      ? "outline"
                      : task.status === "In Progress"
                      ? "secondary"
                      : task.status === "Overdue"
                      ? "destructive"
                      : "default"
                  }
                  className="ml-auto whitespace-nowrap"
                >
                  {task.status}
                </Badge>
              </div>
              {index < recentTasks.slice(0, 5).length - 1 && (
                <Separator className="my-1" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-4 flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarClock className="mr-1 h-4 w-4" />
          Recently updated
        </div>
        <div className="text-sm font-medium">
          Total: {recentTasks.length}
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecentTask;
