"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import axios, { type AxiosError } from "axios"
import { useState } from "react"
import { toast } from "sonner"
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createCompanySchema } from "@/schemas/company-schema"
import { useRouter } from "next/navigation"
import { env } from "@/config/env"
import type { ApiResponse } from "@/types/api-success-type"

function CreateCompanyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState("Preparing your signup workspace...")
  const router = useRouter()

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
  })

  const onSubmit = async (data: z.infer<typeof createCompanySchema>) => {
    setIsSubmitting(true)
    try {
      const response = await axios.post(`${env.BACKEND_BASE_URL}/api/company/add-new-company`, data)
      toast.success(response.data.message || "Company created successfully!")
      const company = response.data.data as { id?: string }

      if (response.data.success) {
        if (!company?.id) {
          toast.error("Company created, but signup link is missing. Please try again.")
          return
        }

        const signupPath = `/signup/${company.id}`
        setIsRedirecting(true)

        // Warm up the route before redirect to reduce perceived delay on production.
        router.prefetch(signupPath)

        setTimeout(() => {
          setRedirectMessage("Redirecting to signup page...")
        }, 1200)

        router.push(signupPath)
      }
    } catch (error) {
      console.error("Error during company creation:", error)
      const axiosError = error as AxiosError<ApiResponse>
      const errorMessage =
        axiosError.response?.data.message ?? "There was a problem creating your company. Please try again."
      toast.error(errorMessage)
    } finally {
      if (!isRedirecting) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-4 font-sans">
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm">
          <div className="w-[92%] max-w-md rounded-2xl border border-white/40 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-violet-100 p-3 text-violet-600">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">Company Created Successfully</h3>
                <p className="mt-1 text-sm text-slate-600">{redirectMessage}</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-violet-100">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-violet-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl p-8 bg-white/80 dark:bg-slate-700/40 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-8 text-center">Create a Company</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem className="transition-all duration-200 hover:translate-y-[-2px]">
                  <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">Company Name</FormLabel>
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
                  <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">Category</FormLabel>
                  <Input
                    {...field}
                    placeholder="Enter company category"
                    className="rounded-xl py-3 px-4 border-purple-200 dark:border-slate-500 focus:border-purple-400 focus:ring focus:ring-purple-200 dark:focus:ring-purple-800/30 transition-all duration-300 shadow-sm hover:shadow-md"
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
                  <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">Street Address</FormLabel>
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
                    <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">City</FormLabel>
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
                    <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">State</FormLabel>
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
                    <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">Zip Code</FormLabel>
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
                    <FormLabel className="text-purple-600 dark:text-purple-300 font-medium">Country</FormLabel>
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
              disabled={isSubmitting || isRedirecting}
              className="w-full cursor-pointer mt-8 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl py-4 font-medium text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating company...
                </>
              ) : isRedirecting ? (
                "Redirecting..."
              ) : (
                "Create Company"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default CreateCompanyPage

