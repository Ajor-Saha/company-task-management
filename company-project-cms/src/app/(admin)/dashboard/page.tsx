"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { env } from "@/config/env";
import useAuthStore from "@/store/store";
import { Axios } from "@/config/axios";

const Dashboard = () => {
  

  return (
    <div className="p-10">
      <h1>Dashboard</h1>
      <Button onClick={() => console.log("clicked")}>Click me</Button>
    </div>
  );
};

export default Dashboard;
