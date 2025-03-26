"use client";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import axios, { type AxiosError } from "axios";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateCompanySchema } from "@/schemas/update-company-schema";
import { useRouter } from "next/navigation";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/api-success-type";

interface Company {
  id: string;
  name: string;
  category: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

function UpdateCompanyPage({ companyId }: { companyId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const router = useRouter();

  // Fetch the company data for editing
  // useEffect(() => {
  //   const fetchCompany = async () => {
  //     try {
  //       const response = await axios.get(`${env.BACKEND_BASE_URL}/api/company/${companyId}`);
  //       setCompany(response.data.data);
  //     } catch (error) {
  //       console.error("Error fetching company data:", error);
  //     }
  //   };
  //   fetchCompany();
  // }, [companyId]);

  const form = useForm<z.infer<typeof updateCompanySchema>>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: company || {
      name: "",
      category: "",
      description: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
    },
  });

  const onSubmit = async (data: z.infer<typeof updateCompanySchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `${env.BACKEND_BASE_URL}/api/company/update/${companyId}`,
        data
      );
      toast.success(response.data.message || "Company updated successfully!");
      const updatedCompany = response.data.data;
      if (response.data.success) {
        setCompany(updatedCompany);
        // router.push(`/company/${updatedCompany.id}`);
      }
    } catch (error) {
      console.error("Error during company update:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage =
        axiosError.response?.data.message ??
        "There was a problem updating your company. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // if (!company) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl p-8 bg-white/80 dark:bg-slate-700/40 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-8 text-center">
          Update Company
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                  <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">
                    Company Name
                  </FormLabel>
                  <Input
                    {...field}
                    placeholder="Enter company name"
                    className="rounded-xl py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                  <FormMessage className="text-pink-500" />
                </FormItem>
              )}
            />

            <FormField
              name="category"
              control={form.control}
              render={({ field }) => (
                <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                  <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">
                    Category
                  </FormLabel>
                  <Input
                    {...field}
                    placeholder="Enter company category"
                    className="rounded-xl py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                  <FormMessage className="text-pink-500" />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                  <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">
                    Description
                  </FormLabel>
                  <Textarea
                    {...field}
                    placeholder="Enter a brief description of your company"
                    rows={5} // Set the number of rows for the Textarea to make it taller
                    className="rounded-xl bg-white dark:bg-slate-800  py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md w-full" // Added w-full to make it take full width
                  />
                  <FormMessage className="text-pink-500" />
                </FormItem>
              )}
            />

            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-300 mt-8 mb-4 pb-2 border-b border-purple-100 dark:border-slate-600">
              Address Information
            </h3>

            <FormField
              name="address.street"
              control={form.control}
              render={({ field }) => (
                <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                  <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">
                    Street Address
                  </FormLabel>
                  <Input
                    {...field}
                    placeholder="Enter street address"
                    className="rounded-xl py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                  <FormMessage className="text-pink-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="address.city"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                    <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">
                      City
                    </FormLabel>
                    <Input
                      {...field}
                      placeholder="Enter city"
                      className="rounded-xl py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md"
                    />
                    <FormMessage className="text-pink-500" />
                  </FormItem>
                )}
              />

              <FormField
                name="address.state"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                    <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">
                      State
                    </FormLabel>
                    <Input
                      {...field}
                      placeholder="Enter state"
                      className="rounded-xl py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md"
                    />
                    <FormMessage className="text-pink-500" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="address.zipCode"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                    <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">
                      Zip Code
                    </FormLabel>
                    <Input
                      {...field}
                      placeholder="Enter zip code"
                      className="rounded-xl py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md"
                    />
                    <FormMessage className="text-pink-500" />
                  </FormItem>
                )}
              />

              <FormField
                name="address.country"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                    <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">
                      Country
                    </FormLabel>
                    <Input
                      {...field}
                      placeholder="Enter country"
                      className="rounded-xl py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md"
                    />
                    <FormMessage className="text-pink-500" />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer mt-8 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl py-4 font-medium text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Please wait
                </>
              ) : (
                "Update Company"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default UpdateCompanyPage;
