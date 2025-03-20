"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formSchema } from "@/schemas/update-profile-schema";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/api-success-type";
interface profile {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: any;
}
type ProfileFormValues = z.infer<typeof formSchema>;

export default function ProfileSettings() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<profile | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: profile || {
      firstName: "",
      lastName: "",
      email: "shanto@gmail.com",
    },
  });

  // Fetch the user's profile on mount
  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     try {
  //       const response = await axios.get(`${env.BACKEND_BASE_URL}/api/profile`);
  //       setProfile(response.data.data); // Set profile data
  //     } catch (error) {
  //       console.error("Error fetching profile:", error);
  //       toast.error("Failed to load profile data.");
  //     }
  //   };

  //   fetchProfile();
  // }, []);

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `${env.BACKEND_BASE_URL}/api/profile/update`,
        data
      );
      toast.success("Profile updated successfully!");
      if (response.data.data) {
        setProfile(response.data.data);
      }
      // Update the local profile state with new data
    } catch (error) {
      console.error("Error updating profile:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage =
        axiosError.response?.data.message ??
        "An error occurred while updating the profile.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the profile is not loaded yet, show loading spinner
  // if (!profile) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-1">My Profile</h1>
                <p className="text-muted-foreground">
                  Manage your profile settings
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-4">
                    Your profile photo
                  </h2>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border border-border">
                        <Image
                          // src={profile.photo ||"/asset/mysterious-mafia-man-smoking-cigarette_52683-34828.avif"}
                          src="/asset/mysterious-mafia-man-smoking-cigarette_52683-34828.avif"
                          alt="Profile"
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2 hover:text-green-500"
                      >
                        <Upload className="h-4 w-4" />
                        Change photo
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Add your photo. Recommended size is 256×256px
                      </p>
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field}
                            placeholder="Enter First Name"
                            />
                            
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} 
                            placeholder=" Enter Last Name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled
                              className="bg-muted/30 text-muted-foreground cursor-not-allowed"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full cursor-pointer mt-8 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-l py-4 font-medium text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                       {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Please wait
                </>
              ) : (
                "Update Profile"
              )}
                    </Button>
                  </form>
                </Form>
              </div>
              <div className="flex flex-col justify-between items-start flex-grow w-full border border-border rounded-lg p-6">
                <div className="relative w-full h-auto flex-grow py-4">
                  <Image
                    src="/asset/young-man-cartoon-character-with-phone_23-2150964369.avif"
                    alt="Profile Illustration"
                    layout="intrinsic"
                    width={400}
                    height={400}
                    className="rounded-lg w-full h-auto object-contain"
                  />
                  <div className="flex flex-col py-2 text-center max-w-xs">
                    <h3 className="font-medium mb-2">
                      Build trust with your profile!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your profile information helps others recognize you and
                      builds credibility. A complete profile increases
                      engagement and trust.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
