"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ClipboardCheck, Tag } from "lucide-react";
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
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskDetailsDialog } from "@/components/task/task-details-dialog";

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

interface AssignedMeTaskProps {
  tasks: Task[];
  loading: boolean;
  userId?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export default function AssignedMeTask({
  tasks,
  loading,
  userId,
  firstName,
  lastName,
  avatar,
}: AssignedMeTaskProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "to-do": false,
    "in-progress": false,
    review: false,
    hold: false,
    completed: false,
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const toggleSection = (status: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const groupedTasks: Record<string, Task[]> = {
    "to-do": [],
    "in-progress": [],
    review: [],
    hold: [],
    completed: [],
  };

  tasks.forEach((task) => {
    if (groupedTasks[task.status]) {
      groupedTasks[task.status].push(task);
    }
  });

  const statusLabel: Record<string, string> = {
    "to-do": "To Do",
    "in-progress": "In Progress",
    review: "In Review",
    hold: "On Hold",
    completed: "Completed",
  };

  const badgeVariant: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    "to-do": "outline",
    "in-progress": "secondary",
    review: "default",
    hold: "destructive",
    completed: "default",
  };

  const totalTasks = tasks.length;

  // Skeleton for a single collapsible section
  const SkeletonSection = () => (
    <div className="mb-4 border rounded-md overflow-hidden">
      <div className="flex items-center justify-between w-full p-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>
      </div>
      <div className="space-y-0 p-1">
        {/* Simulate 2-3 tasks per section */}
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index}>
            <div className="flex items-center py-3 px-3 rounded-md">
              <Skeleton className="h-4 w-4 mr-2 rounded-full" />
              <div className="flex justify-between w-full items-center">
                <Skeleton className="h-4 w-[60%]" />
                <Skeleton className="h-6 w-16 ml-4 shrink-0 rounded" />
              </div>
            </div>
            {index < 1 && <Separator className="my-1" />}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <CardTitle>Assigned to Me</CardTitle>
        </div>
        <CardDescription>Tasks currently assigned to you</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow px-6 pb-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonSection key={index} />
            ))}
          </div>
        ) : (
          <>
            {Object.entries(groupedTasks).map(([status, taskList]) => {
              if (taskList.length === 0) return null;
              return (
                <Collapsible
                  key={status}
                  open={openSections[status]}
                  onOpenChange={() => toggleSection(status)}
                  className="mb-4 border rounded-md overflow-hidden transition-all"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-2">
                      {openSections[status] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-medium">
                        {statusLabel[status]}
                      </h3>
                      <Badge variant={badgeVariant[status]}>
                        {taskList.length}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="space-y-0 p-1">
                      {taskList.map((task, index) => (
                        <div key={task.id}>
                          <div className="flex items-center py-3 group hover:bg-muted/40 px-3 rounded-md transition-colors">
                            <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex justify-between w-full items-center">
                              <button
                                onClick={() => setSelectedTask(task)}
                                className="text-sm group-hover:text-primary transition-colors text-left"
                              >
                                {task.name}
                              </button>
                              {task.projectName && (
                                <Badge
                                  variant="outline"
                                  className="ml-4 shrink-0"
                                >
                                  <Link
                                    href={`/project/details/${task.projectId}`}
                                  >
                                    {task.projectName}
                                  </Link>
                                </Badge>
                              )}
                            </div>
                          </div>
                          {index < taskList.length - 1 && (
                            <Separator className="my-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {totalTasks === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mb-2 opacity-20" />
                <p>No tasks assigned to you yet</p>
                <p className="text-xs">
                  Tasks assigned to you will appear here
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="pt-4 flex justify-between">
        <div className="text-sm text-muted-foreground">
          Status: {totalTasks > 0 ? "Active" : "No Tasks"}
        </div>
        <div className="text-sm font-medium">
          {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
        </div>
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
