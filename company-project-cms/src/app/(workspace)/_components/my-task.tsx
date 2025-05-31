'use client';
import { useState, useMemo } from "react";
import { Calendar, ChevronDown, ChevronRight, Clock, ListTodo } from "lucide-react";
import Link from "next/link";
import { TaskDetailsDialog } from "@/components/task/task-details-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Task = {
  id: string;
  name: string;
  status: 'to-do' | 'in-progress' | 'review' | 'hold' | 'completed';
  description?: string | null;
  endDate?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  createdAt: string;
  updatedAt: string;
};

interface MyTaskProps {
  tasks: Task[];
  loading: boolean;
  userId?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

const MyTask: React.FC<MyTaskProps> = ({ tasks, loading, userId, firstName, lastName, avatar }) => {
  const [openSections, setOpenSections] = useState({
    today: false,
    overdue: false,
    future: false,
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  const toggleSection = (section: "today" | "overdue" | "future") => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.endDate) return false;
      const endDate = new Date(task.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate.getTime() === today.getTime();
    });
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.endDate) return false;
      const endDate = new Date(task.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate.getTime() < today.getTime();
    });
  }, [tasks]);

  const futureTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.endDate) return false;
      const endDate = new Date(task.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate.getTime() > today.getTime();
    });
  }, [tasks]);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter((task) => !task.endDate);
  }, [tasks]);

  const totalTasks = todayTasks.length + overdueTasks.length + futureTasks.length;

  // Skeleton for a single collapsible section
  const SkeletonSection = () => (
    <div className="mb-4 border rounded-md overflow-hidden">
      <div className="flex items-center justify-between w-full p-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-0 p-1">
        {/* Simulate 2 tasks per section */}
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index}>
            <div className="flex items-center justify-between py-3 px-3 rounded-md">
              <div className="flex items-center">
                <Skeleton className="h-2 w-2 rounded-full mr-2" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            {index < 1 && <Separator className="my-1" />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTasks = (tasks: Task[]) => {
    return tasks.length === 0 ? (
      <div>
        <p className="text-muted-foreground text-sm">No tasks found.</p>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div key={task.id}>
            <div className="flex items-center py-2 group hover:bg-muted/40 px-2 rounded-md transition-colors">
              <div className="flex-1 overflow-hidden">
                <button
                  onClick={() => handleTaskClick(task)}
                  className="text-sm font-medium group-hover:text-primary truncate transition-colors text-left"
                >
                  {task.name}
                </button>
              </div>
              {task.projectId ? (
                <Badge variant="default" className="ml-auto">
                  <Link href={`/project/details/${task.projectId}`}>
                    {task.projectName}
                  </Link>
                </Badge>
              ) : (
                <Badge 
                  variant={
                    task.status === "to-do" 
                      ? "outline" 
                      : task.status === "in-progress" 
                      ? "secondary"
                      : task.status === "hold" 
                      ? "destructive" 
                      : "default"
                  }
                  className="ml-auto capitalize"
                >
                  {task.status}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <ListTodo className="h-5 w-5 text-primary" />
            <CardTitle>My Work</CardTitle>
          </div>
          <CardDescription>Tasks scheduled for you</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow px-6 pb-4">
          {loading ? (
            // Show 3 skeleton sections to mimic loading state
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonSection key={index} />
              ))}
            </div>
          ) : (
            <>
              {/* Today Section */}
              {todayTasks.length > 0 && (
                <Collapsible
                  open={openSections.today}
                  onOpenChange={() => toggleSection("today")}
                  className="mb-4 border rounded-md overflow-hidden transition-all"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-2">
                      {openSections.today ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-medium flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Today
                      </h3>
                      <Badge variant="outline">{todayTasks.length}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Current Tasks</div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-0 p-1">
                      {todayTasks.map((task, index) => (
                        <div key={task.id}>
                          <div className="flex items-center justify-between py-3 group hover:bg-muted/40 px-3 rounded-md transition-colors" onClick={() => handleTaskClick(task)}>
                            <div className="flex items-center">
                              <div className="mr-2 h-2 w-2 rounded-full bg-secondary" />
                              <p className="text-sm group-hover:text-primary transition-colors">{task.name}</p>
                            </div>
                            {task.projectName && (
                              <Badge variant="outline">{task.projectName}</Badge>
                            )}
                          </div>
                          {index < todayTasks.length - 1 && <Separator className="my-1" />}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Overdue Section */}
              {overdueTasks.length > 0 && (
                <Collapsible
                  open={openSections.overdue}
                  onOpenChange={() => toggleSection("overdue")}
                  className="mb-4 border border-destructive/20 rounded-md overflow-hidden transition-all"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-destructive/5 transition-colors">
                    <div className="flex items-center space-x-2">
                      {openSections.overdue ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-medium text-destructive flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Overdue
                      </h3>
                      <Badge variant="destructive">{overdueTasks.length}</Badge>
                    </div>
                    <div className="text-xs text-destructive/70">Requires Attention</div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-0 p-1">
                      {overdueTasks.map((task, index) => (
                        <div key={task.id}>
                          <div className="flex items-center cursor-pointer justify-between py-3 group hover:bg-destructive/5 px-3 rounded-md transition-colors" onClick={() => handleTaskClick(task)}>
                            <div className="flex items-center">
                              <div className="mr-2 h-2 w-2 rounded-full bg-destructive" />
                              <p className="text-sm text-destructive group-hover:text-destructive/80 transition-colors">{task.name}</p>
                            </div>
                            {task.projectName && (
                              <Badge variant="outline">{task.projectName}</Badge>
                            )}
                          </div>
                          {index < overdueTasks.length - 1 && <Separator className="my-1" />}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Future Section */}
              {futureTasks.length > 0 && (
                <Collapsible
                  open={openSections.future}
                  onOpenChange={() => toggleSection("future")}
                  className="border rounded-md overflow-hidden transition-all"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-2">
                      {openSections.future ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-medium flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Upcoming
                      </h3>
                      <Badge variant="secondary">{futureTasks.length}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Future Work</div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-0 p-1">
                      {futureTasks.map((task, index) => (
                        <div key={task.id}>
                          <div className="flex items-center justify-between py-3 group hover:bg-muted/40 px-3 rounded-md transition-colors" onClick={() => handleTaskClick(task)}>
                            <div className="flex items-center">
                              <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                              <p className="text-sm group-hover:text-primary transition-colors">{task.name}</p>
                            </div>
                            {task.projectName && (
                              <Badge variant="secondary">{task.projectName}</Badge>
                            )}
                          </div>
                          {index < futureTasks.length - 1 && <Separator className="my-1" />}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {totalTasks === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                  <ListTodo className="h-12 w-12 mb-2 opacity-20" />
                  <p>No tasks scheduled for you</p>
                  <p className="text-xs">Your tasks will appear here when scheduled</p>
                </div>
              )}
            </>
          )}
        </CardContent>
        <Separator />
        <CardFooter className="pt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{totalTasks}</span> active tasks
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="font-normal">
              {unscheduledTasks.length} unscheduled
            </Badge>
          </div>
        </CardFooter>
      </Card>
      
      {selectedTask && (
        <TaskDetailsDialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          task={selectedTask}
          userId={userId}
          firstName={firstName}
          lastName={lastName}
          avatar={avatar}
          onTaskUpdate={() => window.dispatchEvent(new CustomEvent('task-updated'))}
        />
      )}
    </>
  );
};

export default MyTask;