'use client'

import { useState } from "react";
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
import { assignedToMe } from "@/constants";

const AssignedMeTask = () => {
  const [openSections, setOpenSections] = useState({
    review: false,
    progress: false,
    hold: false,
  });

  const toggleSection = (section: "review" | "progress" | "hold") => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const totalTasks = assignedToMe.review.length + assignedToMe.progress.length + assignedToMe.hold.length;

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
        {/* In Review Section */}
        {assignedToMe.review.length > 0 && (
          <Collapsible
            open={openSections.review}
            onOpenChange={() => toggleSection("review")}
            className="mb-4 border rounded-md overflow-hidden transition-all"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-2">
                {openSections.review ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className="text-sm font-medium">In Review</h3>
                <Badge variant="outline">{assignedToMe.review.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Code Reviews</div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0 p-1">
                {assignedToMe.review.map((task, index) => (
                  <div key={task.id}>
                    <div className="flex items-center py-3 group hover:bg-muted/40 px-3 rounded-md transition-colors">
                      <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p className="text-sm group-hover:text-primary transition-colors">{task.title}</p>
                    </div>
                    {index < assignedToMe.review.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* In Progress Section */}
        {assignedToMe.progress.length > 0 && (
          <Collapsible
            open={openSections.progress}
            onOpenChange={() => toggleSection("progress")}
            className="mb-4 border rounded-md overflow-hidden transition-all"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-2">
                {openSections.progress ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className="text-sm font-medium">In Progress</h3>
                <Badge variant="secondary">{assignedToMe.progress.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Active Work</div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0 p-1">
                {assignedToMe.progress.map((task, index) => (
                  <div key={task.id}>
                    <div className="flex items-center py-3 group hover:bg-muted/40 px-3 rounded-md transition-colors">
                      <div className="mr-2 h-2 w-2 rounded-full bg-secondary" />
                      <p className="text-sm group-hover:text-primary transition-colors">{task.title}</p>
                    </div>
                    {index < assignedToMe.progress.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* On Hold Section */}
        {assignedToMe.hold.length > 0 && (
          <Collapsible
            open={openSections.hold}
            onOpenChange={() => toggleSection("hold")}
            className="border rounded-md overflow-hidden transition-all"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-2">
                {openSections.hold ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className="text-sm font-medium">On Hold</h3>
                <Badge variant="default">{assignedToMe.hold.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Waiting</div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0 p-1">
                {assignedToMe.hold.map((task, index) => (
                  <div key={task.id}>
                    <div className="flex items-center py-3 group hover:bg-muted/40 px-3 rounded-md transition-colors">
                      <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-sm group-hover:text-primary transition-colors">{task.title}</p>
                    </div>
                    {index < assignedToMe.hold.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {totalTasks === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mb-2 opacity-20" />
            <p>No tasks assigned to you yet</p>
            <p className="text-xs">Tasks assigned to you will appear here</p>
          </div>
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
    </Card>
  );
};

export default AssignedMeTask;
