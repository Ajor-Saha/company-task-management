"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { toast } from "sonner";

interface Employee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  assignedEmployees?: Employee[];
  totalTasks?: number;
}

interface AssignEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onRefreshProjects: () => void;
}

export default function AssignEmployeeDialog({
  open,
  onClose,
  project,
  onRefreshProjects,
}: AssignEmployeeDialogProps) {
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!project) return;

      try {
        const response = await Axios.get(
          `${env.BACKEND_BASE_URL}/api/employee/get-available-employee/${project.id}`
        );
        if (response.data?.success) {
          setAvailableEmployees(response.data.data.availableEmployees);
          setAssignedEmployees(response.data.data.assignedEmployees);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    if (open) fetchEmployees();
  }, [open, project]);

  const assignEmployee = async (employee: Employee) => {
    if (!project) return;

    try {
      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/project/assign-employee-project?projectId=${project.id}&employeeId=${employee.userId}`
      );

      if (response.data?.success) {
        toast.success(`${employee.firstName} assigned to ${project.name}`);
        onRefreshProjects();
        onClose();
      } else {
        setStatusMessage({
          text: response.data?.message || "Failed to assign.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({
        text: "Assignment failed.",
        type: "error",
      });
    }
  };

  const removeEmployee = async (employee: Employee) => {
    if (!project) return;

    try {
      const response = await Axios.delete(
        `${env.BACKEND_BASE_URL}/api/project/remove-employee-project?projectId=${project.id}&employeeId=${employee.userId}`
      );

      if (response.data?.success) {
        toast.success(`${employee.firstName} removed from ${project.name}`);
        onRefreshProjects();
        onClose();
      } else {
        setStatusMessage({
          text: response.data?.message || "Failed to remove.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({
        text: "Removal failed.",
        type: "error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {project && (
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assign Employee to {project.name}</DialogTitle>
            <DialogDescription>
              Select an employee to assign to this project.
            </DialogDescription>
          </DialogHeader>

          {statusMessage && (
            <div
              className={`mb-2 p-2 rounded ${
                statusMessage.type === "success"
                  ? "bg-green-200 text-green-800"
                  : "bg-red-200 text-red-800"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{statusMessage.text}</span>
                <button onClick={() => setStatusMessage(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="py-4">
            <div className="h-[300px] overflow-y-auto pr-1">
              {availableEmployees.length > 0 || assignedEmployees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableEmployees.map((employee) => (
                      <TableRow key={employee.userId}>
                        <TableCell>
                          <div className="flex items-center">
                            {employee.firstName} {employee.lastName}
                          </div>
                        </TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => assignEmployee(employee)}
                          >
                            Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {assignedEmployees.map((employee) => (
                      <TableRow key={employee.userId}>
                        <TableCell>
                          <div className="flex items-center">
                            {employee.firstName} {employee.lastName}
                          </div>
                        </TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeEmployee(employee)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  No available employees found.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
