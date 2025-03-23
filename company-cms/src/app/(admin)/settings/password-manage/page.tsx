"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { passwordSchema } from "@/schemas/update-password-schema";
import axios, { AxiosError } from "axios";
import { env } from "@/config/env";

type FormData = z.infer<typeof passwordSchema>;

const UpdatePassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current: "",
      new: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Use PUT request for updating password
      const response = await axios.put(
        `${env.BACKEND_BASE_URL}/api/auth/update-password`,
        data
      );
      toast.success(response.data.message || "Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError?.response?.data?.message ||
        "There was a problem updating your password.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen  w-full flex items-center justify-center p-16">
      <Card className="p-8 w-full dark:bg-slate-700/50">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password here. After saving, you'll be logged out.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                {...form.register("current")}
                className={`${
                  form.formState.errors.current ? "border-red-500" : ""
                }`}
              />
              {form.formState.errors.current && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.current.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                {...form.register("new")}
                className={`${
                  form.formState.errors.new ? "border-red-500" : ""
                }`}
              />
              {form.formState.errors.new && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.new.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
                className={`${
                  form.formState.errors.confirmPassword ? "border-red-500" : ""
                }`}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter >
            <Button
              type="submit"
              className="w-full cursor-pointer mt-8 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-l py-2 font-medium text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Please wait
                </>
              ) : (
                "Save Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UpdatePassword;
