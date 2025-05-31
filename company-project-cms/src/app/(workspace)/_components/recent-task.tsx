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
import { TaskDetailsDialog } from "@/components/task/task-details-dialog";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

type Task = {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  endDate?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  createdAt: string;
  updatedAt: string;
};

interface RecentTaskProps {
  tasks: Task[];
  loading: boolean;
  userId?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export default function RecentTask({ 
  tasks, 
  loading,
  userId,
  firstName,
  lastName,
  avatar 
}: RecentTaskProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Render one skeleton row
  function SkeletonRow() {
    return (
      <div className="flex items-center py-3 px-2 rounded-md animate-pulse">
        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
        <div className="flex-1 ml-3">
          <Skeleton className="h-4 w-[60%] mb-1" />
          <Skeleton className="h-3 w-[40%]" />
        </div>
        <Skeleton className="h-6 w-16 ml-auto" />
      </div>
    );
  }

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
        <div className="space-y-1">
          {loading ? (
            // Show 5 skeleton rows
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent tasks found.</p>
          ) : (
            tasks.map((task, idx) => (
              <div key={task.id}>
                <div className="flex items-center py-3 group hover:bg-muted/40 px-2 rounded-md transition-colors">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="text-sm font-medium group-hover:text-primary truncate transition-colors text-left"
                      >
                        {task.name}
                      </button>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.projectId
                        ? "default"
                        : task.status === "to-do"
                        ? "outline"
                        : task.status === "in-progress"
                        ? "secondary"
                        : task.status === "hold"
                        ? "destructive"
                        : "default"
                    }
                    className="ml-auto whitespace-nowrap capitalize"
                  >
                    {task.projectId ? (
                      <Link
                        href={`/project/details/${task.projectId}`}
                        className="block"
                      >
                        {task.projectName}
                      </Link>
                    ) : (
                      task.status
                    )}
                  </Badge>
                </div>
                {idx < tasks.length - 1 && <Separator className="my-1" />}
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Separator />
      <CardFooter className="pt-4 flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarClock className="mr-1 h-4 w-4" />
          Recently updated
        </div>
        <div className="text-sm font-medium">Total: {tasks.length}</div>
      </CardFooter>

      {selectedTask && (
        <TaskDetailsDialog
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          task={selectedTask}
          userId={userId}
          firstName={firstName}
          lastName={lastName}
          avatar={avatar}
          onTaskUpdate={() => window.dispatchEvent(new CustomEvent('task-updated'))}
        />
      )}
    </Card>
  );
}