"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import Image from "next/image";
import { signupSchema } from "@/schemas/auth-schema";
import { env } from "@/config/env";

export default function SignUpPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const params = useParams<{ companyId: string }>();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      companyId: params.companyId,
    },
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${env.BACKEND_BASE_URL}/api/auth/signup`,
        data
      );
      toast.success(response.data.message || "Sign up successful", {
        description:
          "We sent a verification code to your email. Please check your Inbox and Spam/Junk folder.",
        duration: 6000,
      });

      setIsRedirecting(true);
      setTimeout(() => {
        router.push(`/verify/${data.email}`);
      }, 900);
    } catch (error) {
      console.error("Error during sign-up:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data.message ??
        "There was a problem with your sign-up. Please try again.";
      toast.error(errorMessage);
    } finally {
      if (!isRedirecting) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm">
          <div className="w-[92%] max-w-md rounded-2xl border border-white/40 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">Verify Your Email</h3>
                <p className="mt-1 text-sm text-slate-600">
                  We sent a verification code. Please check your Inbox and Spam/Junk folder.
                </p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl shadow-lg rounded-lg p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Section */}
          <div className="flex flex-col justify-between">
            <h2 className="text-2xl font-bold mb-4">Welcome</h2>
            <div className="flex-grow flex items-center justify-center">
              <Image
                src="/asset/SignUp.png"
                alt="Sign Up"
                width={400}
                height={400}
                className="object-contain"
              />
            </div>
          </div>

          {/* Right Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  name="firstName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <Input {...field} placeholder="Enter your first name" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="lastName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <Input {...field} placeholder="Enter your last name" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <Input
                        {...field}
                        placeholder="Enter your email"
                        type="email"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting || isRedirecting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : isRedirecting ? (
                    "Redirecting to verification..."
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-4">
              <span className="text-sm">Already have an account? </span>
              <Link href="/sign-in" className="text-blue-500 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
