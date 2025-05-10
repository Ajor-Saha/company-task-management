export const recentTasks = [
  { id: 1, title: "Code Review for Feature X", status: "Pending" },
  { id: 2, title: "UI Design Review", status: "In Progress" },
  { id: 3, title: "API Development for Authentication", status: "Ongoing" },
  { id: 4, title: "Frontend Integration", status: "In Progress" },
  { id: 5, title: "Database Schema Finalization", status: "On Hold" },
  { id: 6, title: "Deployment on Staging", status: "Paused" },
];

export const myWorks = {
  today: [
    { id: 7, title: "Fix Login Bug", status: "Pending" },
    { id: 8, title: "Write Unit Tests for API", status: "In Progress" },
  ],

  overdue: [
    { id: 9, title: "Complete Dashboard UI", status: "Overdue" },
    { id: 10, title: "Optimize Database Queries", status: "Overdue" },
  ],

  next: [
    { id: 11, title: "Implement Payment Gateway", status: "Planned" },
    { id: 12, title: "Write Documentation", status: "Upcoming" },
  ],

  unschedule: [
    { id: 13, title: "Research AI Model Deployment", status: "Not Scheduled" },
    { id: 14, title: "Setup CI/CD Pipeline", status: "Not Scheduled" },
  ],
};

export const assignedToMe = {
  review: [{ id: 1, title: "Code Review for Feature X" }],
  progress: [
    { id: 2, title: "UI Design Review" },
    { id: 3, title: "API Development for Authentication" },
    { id: 4, title: "Frontend Integration" },
  ],
  hold: [{ id: 5, title: "Database Schema Finalization" }],
};

export const tasks = [
    { id: 1, title: "Setup project repository", completed: true },
    { id: 2, title: "Design database schema", completed: false },
    { id: 3, title: "Implement auth module", completed: false },
  ];

export interface Subtask {
  name: string;
  assignee: string;
  priority: string;
  dueDate: string;
  status: string;
}


export const initialSubtasks: Subtask[] = [
  {
    name: 'React Testing Library "Crash Course" by Traversy Media',
    assignee: "",
    priority: "",
    dueDate: "",
    status: "To-do",
  },
  {
    name: "Online Material: HONO TESTING GUIDE",
    assignee: "",
    priority: "",
    dueDate: "",
    status: "To-do",
  },
  {
    name: "Follow Full stack serverless course",
    assignee: "",
    priority: "",
    dueDate: "",
    status: "To-do",
  },
  {
    name: "Learnathon-Auth Module Complete - End to End",
    assignee: "",
    priority: "",
    dueDate: "",
    status: "To-do",
  },
  {
    name: "Learn GEN AI",
    assignee: "",
    priority: "",
    dueDate: "",
    status: "To-do",
  },
];

export const statusColors = {
  'to-do': 'bg-gray-100 dark:bg-gray-800',
  'in-progress': 'bg-blue-100 dark:bg-blue-800/30',
  'completed': 'bg-green-100 dark:bg-green-800/30',
  'review': 'bg-yellow-100 dark:bg-yellow-800/30',
  'hold': 'bg-red-100 dark:bg-red-800/30'
};

export interface User {
  id: string;
  name: string;
  profilePic: string;
}

export const users: User[] = [
  { id: "1", name: "John Doe", profilePic: "https://via.placeholder.com/40" },
  { id: "2", name: "Jane Smith", profilePic: "https://via.placeholder.com/40" },
  {
    id: "3",
    name: "Alice Johnson",
    profilePic: "https://via.placeholder.com/40",
  },
];