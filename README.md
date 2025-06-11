# Project 350-TaskForge 🚀

A modern, full-stack task management solution designed for companies to efficiently manage projects, employees, and tasks.

## 📑 Table of Contents
- [Overview](#overview)
- [Live Websites](#live-websites)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start Guide](#quick-start-guide)
- [Development Guidelines](#development-guidelines)
- [Team](#team)

## Overview
The Company Task Management System is a comprehensive solution that helps organizations streamline their project management processes. It provides a centralized platform for managing employees, projects, and tasks with real-time updates and intuitive dashboards.

## Live Websites
Access our platform through the following links:
- 🔐 **Admin Panel**: [https://admin.taskforges.com](https://admin.taskforges.com)
- 👥 **Employee Workspace**: [https://workspace.taskforges.com](https://workspace.taskforges.com)

## Features
- 👥 **User Management**
  - Role-based access control (Admin, Senior Employee, Employee)
  - Employee profile management
  - Salary and performance tracking

- 📊 **Dashboard & Analytics**
  - Real-time project progress tracking
  - Employee performance metrics
  - Financial analytics and reporting
  - Task completion statistics

- 📝 **Project Management**
  - Create and manage multiple projects
  - Assign team members to projects
  - Track project budgets and deadlines
  - Project status monitoring

- ✅ **Task Management**
  - Create, assign, and track tasks
  - Task priority and deadline management
  - Task status updates
  - File attachments support

- 💬 **Communication**
  - Real-time messaging between team members
  - Project-specific discussion boards
  - create post - @mention project and employee
  - File sharing capabilities

## Tech Stack
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT
- **File Storage**: Cloudflare R2 Storage(bucket)
- **Real-time Features**: WebSocket

## Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ajor-Saha/company-task-management.git
   cd company-task-management
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install admin panel dependencies
   cd ../company-cms
   pnpm install

   # Install project-management dependencies
   cd ../company-project-cms
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   # Backend (.env)
   cp .env.example .env
   # Update environment variables

   # Frontend (.env)
   NEXT_PUBLIC_BACKEND_BASE_URL = 
   GOOGLE_GENERATIVE_AI_API_KEY =
   ```

4. **Database Setup**
   ```bash
   cd server
   npm run db:generate
   npm run db:migrate # Optional: Add sample data
   ```

5. **Start Development Servers**
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start admin panel
   cd ../company-cms
   pnpm dev

   # Start employee panel
   cd ../company-project-cms
   pnpm dev
   ```




## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Create feature branches for new development

### Git Workflow
1. Create feature branch from main
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make focused commits
3. Push changes and create PR
4. Request code review
5. Merge after approval


## Team
- **Ajor Saha** - Full Stack Developer
- **Rafid Adib** - Frontend Developer
- **AlFahad Shanto** - Frontend Developer


