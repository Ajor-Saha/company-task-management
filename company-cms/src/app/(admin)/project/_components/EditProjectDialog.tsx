// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useEffect, useState } from "react";
// import { toast } from "sonner";
// import { Axios } from "@/config/axios";
// import { env } from "@/config/env";

// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
// } from "@/components/ui/popover";
// import { cn } from "@/lib/utils";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import {
//   Form,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { editProjectFormSchema } from "@/schemas/project-schema";
// import { Loader2 } from "lucide-react";

// interface Project {
//   id: string;
//   name: string;
//   description: string;
//   budget: number;
//   status: string;
//   companyId: string;
//   createdAt: string;
//   updatedAt: string;
//   startDate?: string;
//   endDate?: string;
// }

// interface EditProjectDialogProps {
//   open: boolean;
//   onClose: () => void;
//   project: Project | null;
//   onRefreshProjects: () => void;
// }

// export default function EditProjectDialog({
//   open,
//   onClose,
//   project,
//   onRefreshProjects,
// }: EditProjectDialogProps) {
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const form = useForm<z.infer<typeof editProjectFormSchema>>({
//     resolver: zodResolver(editProjectFormSchema),
//     defaultValues: {
//       name: "",
//       budget: "",
//       startDate: "",
//       endDate: "",
//     },
//   });

//   useEffect(() => {
//     if (project) {
//       form.reset({
//         name: project.name,
//         budget: project.budget.toString(),
//         startDate: project.startDate || "",
//         endDate: project.endDate || "",
//       });
//     }
//   }, [project, form]);

//   const onSubmit = async (data: z.infer<typeof editProjectFormSchema>) => {
//     if (!project) return;
//     setIsSubmitting(true);
//     try {
//       const response = await Axios.put(
//         `${env.BACKEND_BASE_URL}/api/project/update-project/${project.id}`,
//         {
//           ...data,
//           budget: Number(data.budget),
//         }
//       );

//       if (response.data?.success) {
//         toast.success("Project updated successfully");
//         onRefreshProjects();
//         onClose();
//       } else {
//         toast.error("Update failed");
//       }
//     } catch (err) {
//       console.error(err);
//       toast.error("Something went wrong");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       {project && (
//         <DialogContent className="sm:max-w-[500px] md:w-[700px]">
//           <DialogHeader>
//             <DialogTitle>Edit Project</DialogTitle>
//             <DialogDescription>
//               Modify the project details and save your changes.
//             </DialogDescription>
//           </DialogHeader>

//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <FormField
//                 name="name"
//                 control={form.control}
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Project Name</FormLabel>
//                     <Input {...field} />
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 name="budget"
//                 control={form.control}
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Budget</FormLabel>
//                     <Input type="number" {...field} />
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="startDate"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel>Start Date</FormLabel>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <Button
//                           variant={"outline"}
//                           className={cn(
//                             "w-full pl-3 text-left font-normal",
//                             !field.value && "text-muted-foreground"
//                           )}
//                         >
//                           <CalendarIcon className="mr-2 h-4 w-4" />
//                           {field.value ? (
//                             format(new Date(field.value), "PPP")
//                           ) : (
//                             <span>Pick a date</span>
//                           )}
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0">
//                         <Calendar
//                           mode="single"
//                           selected={
//                             field.value ? new Date(field.value) : undefined
//                           }
//                           onSelect={(date) =>
//                             field.onChange(date?.toISOString().split("T")[0])
//                           }
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="endDate"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel>End Date</FormLabel>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <Button
//                           variant={"outline"}
//                           className={cn(
//                             "w-full pl-3 text-left font-normal",
//                             !field.value && "text-muted-foreground"
//                           )}
//                         >
//                           <CalendarIcon className="mr-2 h-4 w-4" />
//                           {field.value ? (
//                             format(new Date(field.value), "PPP")
//                           ) : (
//                             <span>Pick a date</span>
//                           )}
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0">
//                         <Calendar
//                           mode="single"
//                           selected={
//                             field.value ? new Date(field.value) : undefined
//                           }
//                           onSelect={(date) =>
//                             field.onChange(date?.toISOString().split("T")[0])
//                           }
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <Button type="submit" disabled={isSubmitting} className="w-full">
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Please wait
//                   </>
//                 ) : (
//                   "Save Changes"
//                 )}
//               </Button>
//             </form>
//           </Form>
//         </DialogContent>
//       )}
//     </Dialog>
//   );
// }






"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { editProjectFormSchema } from "@/schemas/project-schema";
import { Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
}

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onRefreshProjects: () => void;
}

export default function EditProjectDialog({
  open,
  onClose,
  project,
  onRefreshProjects,
}: EditProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof editProjectFormSchema>>({
    resolver: zodResolver(editProjectFormSchema),
    defaultValues: {
      name: "",
      budget: "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        budget: project.budget.toString(),
        startDate: project.startDate || "",
        endDate: project.endDate || "",
      });
    }
  }, [project, form]);

  const onSubmit = async (data: z.infer<typeof editProjectFormSchema>) => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      const response = await Axios.put(
        `${env.BACKEND_BASE_URL}/api/project/update-project/${project.id}`,
        {
          ...data,
          budget: Number(data.budget),
        }
      );

      if (response.data?.success) {
        toast.success("Project updated successfully");
        onRefreshProjects();
        onClose();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {project && (
        <DialogContent className="sm:max-w-[500px] md:w-[700px] bg-gray-800/30 backdrop-blur-sm border border-gray-800/50 text-white">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription className="text-white dark:text-gray-400">
              Modify the project details and save your changes.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <Input {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="budget"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <Input type="number" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) =>
                            field.onChange(date?.toISOString().split("T")[0])
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) =>
                            field.onChange(date?.toISOString().split("T")[0])
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      )}
    </Dialog>
  );
}
