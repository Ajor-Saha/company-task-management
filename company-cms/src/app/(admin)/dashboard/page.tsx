"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { env } from "@/config/env";
import useAuthStore from "@/store/store";
import { Axios } from "@/config/axios";

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/auth/signout`
      );
      if (response.data.success) {
        logout();
        router.push("/sign-in");
      } else {
        throw new Error("Failed to sign out");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  py-10 px-4">
      <div className="max-w-md w-full bg-[var(--light-tan)]/70 dark:bg-[oklch(0.17_0.03_210.65)] shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-[oklch(0.75_0.09_25.54)] dark:bg-[oklch(0.42_0.1_190.0)] text-white flex items-center justify-center text-center text-3xl font-bold uppercase">
            {user?.firstName || "U"}
          </div>
        </div>
        <div className="text-center mt-4">
          <h2 className="text-xl font-bold text-[oklch(0.65_0.05_5.23)] dark:text-[oklch(0.93_0.03_85.08)]">
            {user?.firstName} {" "} {user?.lastName}  
          </h2>
          <p className="text-[oklch(0.62_0.02_83.82)] dark:text-[oklch(0.82_0.06_58.82)]">{user?.email || "user@example.com"}</p>
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[oklch(0.62_0.02_83.82)] dark:text-[oklch(0.62_0.02_83.82)] font-medium">Account Created:</span>
            <span className="text-[oklch(0.17_0.03_210.65)] dark:text-[oklch(0.93_0.03_85.08)]">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
        <div className="mt-8">
          <Button
            onClick={handleLogout}
            className="w-full bg-[oklch(0.3_0.05_180.0)] dark:bg-[oklch(0.3_0.05_180.0)] text-white rounded py-2 font-medium hover:bg-[oklch(0.42_0.1_190.0)] dark:hover:bg-[oklch(0.42_0.1_190.0)] transition duration-200"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
