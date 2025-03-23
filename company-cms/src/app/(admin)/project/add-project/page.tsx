"use client";

import { useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { env } from "@/config/env";
import { projectFormSchema } from "@/schemas/project-schema";
import { Axios } from "@/config/axios";

// Define the type for the RichTextEditor ref
type RichTextEditorHandle = {
  getContent: () => string;
};

export default function AddProject() {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get the description content from the editor
    const rawDescription = editorRef.current?.getContent() || "";
    // Quill typically returns "<p><br></p>" when empty; treat it as empty.
    const description =
      rawDescription === "<p><br></p>" || rawDescription.trim() === ""
        ? ""
        : rawDescription;

        

    // Prepare the form data (using name, description, and budget)
    const formData = {
      name,
      budget: Number(budget),
      description,
    };

    // Validate the data using Zod
    const result = projectFormSchema.safeParse(formData);
    if (!result.success) {
      // Get the first error message from the validation result
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0];
      toast.error(firstError?.[0] || "Validation error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Send a POST request to the API with the form data
      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/project/add-new-project`,
        formData
      );

      if (response.data.success) {
        toast.success("Project created successfully");
        // Reset form fields if needed
        setName("");
        setBudget("");
        // Optionally, reset the rich text editor here if required
      }
    } catch (error) {
      console.error("Error creating project:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data.message ||
        "There was a problem creating the project. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto p-16 bg-background text-foreground">
      <h2 className="text-xl font-semibold mb-6">Add New Project</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-md"
            placeholder="Enter project name"
          />
        </div>

        {/* Description Field (Rich Text Editor) */}
        <div className="space-y-2">
          <Label htmlFor="description">Project Description</Label>
          <RichTextEditor ref={editorRef} />
        </div>

        {/* Budget Field */}
        <div className="space-y-2">
          <Label htmlFor="budget">Budget ($)</Label>
          <Input
            id="budget"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="h-12 rounded-md"
            placeholder="Enter budget"
          />
        </div>

        <Button type="submit" className="w-full py-5 font-semibold" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            "Submit Project"
          )}
        </Button>
      </form>
    </div>
  );
}
