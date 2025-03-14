'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createCompanySchema } from "@/schemas/company-schema";
import { useRouter } from "next/navigation";
import { env } from "@/config/env";
import { ApiResponse } from "@/types/api-success-type";

function CreateCompanyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [company, setCompany] = useState({});
  const router = useRouter();

  const form = useForm<z.infer<typeof createCompanySchema>>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: "",
      category: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
    },
  });

  const onSubmit = async (data: z.infer<typeof createCompanySchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${env.BACKEND_BASE_URL}/api/company/add-new-company`, 
        data
      );
      toast.success(response.data.message || "Company created successfully!");
      const company = response.data.data;
      if (response.data.success) {
        setCompany(company);
        router.push(`/signup/${company.id}`);
      }
    } catch (error) {
      console.error("Error during company creation:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage =
        axiosError.response?.data.message ??
        "There was a problem creating your company. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-gray-500 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl p-8  rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-8">Create a Company</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <Input {...field} placeholder="Enter company name" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="category"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Input {...field} placeholder="Enter company category" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-lg font-semibold text-white">Address</h3>

            <FormField
              name="address.street"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <Input {...field} placeholder="Enter street address" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="address.city"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <Input {...field} placeholder="Enter city" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="address.state"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Input {...field} placeholder="Enter state" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="address.zipCode"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <Input {...field} placeholder="Enter zip code" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="address.country"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Input {...field} placeholder="Enter country" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full cursor-pointer">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Create Company"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default CreateCompanyPage;
