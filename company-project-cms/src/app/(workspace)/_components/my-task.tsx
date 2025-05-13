'use client'

import { useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Clock, ListTodo } from "lucide-react";
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
import { myWorks } from "@/constants";

const MyTask = () => {
  const [openSections, setOpenSections] = useState({
    today: false,
    overdue: false,
    upcoming: false,
  });

  const toggleSection = (section: "today" | "overdue" | "upcoming") => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const totalTasks = myWorks.today.length + myWorks.overdue.length + myWorks.next.length;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <ListTodo className="h-5 w-5 text-primary" />
          <CardTitle>My Work</CardTitle>
        </div>
        <CardDescription>Tasks scheduled for you</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow px-6 pb-4">
        {/* Today Section */}
        {myWorks.today.length > 0 && (
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
                <Badge variant="outline">{myWorks.today.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Current Tasks</div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0 p-1">
                {myWorks.today.map((task, index) => (
                  <div key={task.id}>
                    <div className="flex items-center justify-between py-3 group hover:bg-muted/40 px-3 rounded-md transition-colors">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-secondary" />
                        <p className="text-sm group-hover:text-primary transition-colors">{task.title}</p>
                      </div>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                    {index < myWorks.today.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Overdue Section */}
        {myWorks.overdue.length > 0 && (
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
                <Badge variant="destructive">{myWorks.overdue.length}</Badge>
              </div>
              <div className="text-xs text-destructive/70">Requires Attention</div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0 p-1">
                {myWorks.overdue.map((task, index) => (
                  <div key={task.id}>
                    <div className="flex items-center justify-between py-3 group hover:bg-destructive/5 px-3 rounded-md transition-colors">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-destructive" />
                        <p className="text-sm text-destructive group-hover:text-destructive/80 transition-colors">{task.title}</p>
                      </div>
                      <Badge variant="destructive">{task.status}</Badge>
                    </div>
                    {index < myWorks.overdue.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Upcoming Section */}
        {myWorks.next.length > 0 && (
          <Collapsible
            open={openSections.upcoming}
            onOpenChange={() => toggleSection("upcoming")}
            className="border rounded-md overflow-hidden transition-all"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-2">
                {openSections.upcoming ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className="text-sm font-medium flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Upcoming
                </h3>
                <Badge variant="secondary">{myWorks.next.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Future Work</div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0 p-1">
                {myWorks.next.map((task, index) => (
                  <div key={task.id}>
                    <div className="flex items-center justify-between py-3 group hover:bg-muted/40 px-3 rounded-md transition-colors">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                        <p className="text-sm group-hover:text-primary transition-colors">{task.title}</p>
                      </div>
                      <Badge variant="secondary">{task.status}</Badge>
                    </div>
                    {index < myWorks.next.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {totalTasks === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <ListTodo className="h-12 w-12 mb-2 opacity-20" />
            <p>No tasks scheduled for you</p>
            <p className="text-xs">Your tasks will appear here when scheduled</p>
          </div>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="pt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{totalTasks}</span> active tasks
        </div>
        <div className="flex items-center">
          <Badge variant="outline" className="font-normal">
            {myWorks.unschedule.length} unscheduled
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MyTask;
