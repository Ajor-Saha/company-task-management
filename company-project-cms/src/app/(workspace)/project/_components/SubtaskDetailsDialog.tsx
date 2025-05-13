import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor, {
  RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Subtask } from "./TaskList";
import Image from "next/image";
import { format } from "date-fns";

interface SubtaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtask: Subtask | null;
  updateTask: (
    taskId: string,
    updateData: {
      name?: string;
      description?: string;
      status?: string;
      endDate?: string | null;
      assignedTo?: string;
    }
  ) => Promise<void>;
  onTaskUpdated: () => void;
}

const SubtaskDetailsDialog: React.FC<SubtaskDetailsDialogProps> = ({
  open,
  onOpenChange,
  subtask,
  updateTask,
  onTaskUpdated,
}) => {
  if (!subtask) return null;

  const [editedName, setEditedName] = useState(subtask.name);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const description = editorRef.current?.getContent() || "";
      await updateTask(subtask.id, { name: editedName, description });
      toast.success("Task updated successfully");
      onTaskUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error("Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md lg:max-w-xl bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">
        <DialogHeader>
          <DialogTitle>
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-xl font-bold border-none focus:ring-0 mt-6"
            />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="">
              <strong>Status:</strong> <span>{subtask.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Assignee:</strong>
              <Image
                src={subtask.assignedTo.avatar || "/asset/avatar-pic.png"}
                alt="Avatar"
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
              <span>
                {subtask.assignedTo.firstName} {subtask.assignedTo.lastName}
              </span>
            </div>
          </div>
          <div className="text-sm">
            <strong>Due Date:</strong>{" "}
            {subtask.endDate
              ? format(new Date(subtask.endDate), "PPP")
              : "Not set"}
          </div>
          <div className="space-y-2">
            <strong>Description:</strong>
            <RichTextEditor
              ref={editorRef}
              initialContent={subtask.description || ""}
              key={subtask.id} // Force remount when subtask changes
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubtaskDetailsDialog;