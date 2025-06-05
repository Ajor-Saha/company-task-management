'use client';
import React, { useCallback, useEffect, useState } from "react";
import AssignedMeTask from "./assigned-me";
import MyTask from "./my-task";
import RecentTask from "./recent-task";
import { HomePieChart } from "@/components/charts/home-piechart";
import { AppBarChart } from "@/components/charts/bar-chart";
import axios from "axios";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import useAuthStore from "@/store/store";

import { Task } from "@/types/task";

interface TaskCountData {
  projectTasks: {
    projectName: string;
    taskCount: number;
  }[];
  otherTasks: number;
}

const UserTask = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskCountData, setTaskCountData] = useState<TaskCountData | null>(null);
  const [taskCountLoading, setTaskCountLoading] = useState(false);
  const { user } = useAuthStore();

  const fetchTaskCounts = useCallback(async () => {
    setTaskCountLoading(true);
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/project/get-user-task-counts`
      );
      if (response.data?.success) {
        setTaskCountData(response.data.data);
      } else {
        console.error('API Error:', response.data.message);
      }
    } catch (error) {
      console.error('Fetch Task Counts Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', error.response?.data);
      }
    } finally {
      setTaskCountLoading(false);
    }
  }, []);

  const fetchAssignedTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/task/get-assigned-tasks`
      );
      if (response.data?.success) {
        setTasks(response.data.data);
      } else {
        console.error('API Error:', response.data.message);
      }
    } catch (error) {
      console.error('Fetch Assigned Tasks Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedTasks();
    fetchTaskCounts();

    // Add event listener for task updates
    const handleTaskUpdate = () => {
      fetchAssignedTasks();
      fetchTaskCounts();
    };
    window.addEventListener('task-updated', handleTaskUpdate);

    return () => {
      window.removeEventListener('task-updated', handleTaskUpdate);
    };
  }, [fetchAssignedTasks, fetchTaskCounts]);

  return (
    <div className="p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks Card */}
        <RecentTask 
          tasks={tasks.slice(0, 6)} 
          loading={loading}
          userId={user?.userId}
          firstName={user?.firstName}
          lastName={user?.lastName}
          avatar={user?.avatar}
        />
        {/* Assigned to Me Card */}
        <AssignedMeTask 
          tasks={tasks} 
          loading={loading}
          userId={user?.userId}
          firstName={user?.firstName}
          lastName={user?.lastName}
          avatar={user?.avatar}
        />

        {/* My Work Card */}
        <MyTask 
          tasks={tasks} 
          loading={loading}
          userId={user?.userId}
          firstName={user?.firstName}
          lastName={user?.lastName}
          avatar={user?.avatar}
        />

        {/* Pie Chart */}
        <HomePieChart 
          data={taskCountData} 
          loading={taskCountLoading} 
        />
        
      </div>
    </div>
  );
};

export default UserTask;
