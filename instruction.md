# Watch Service Frontend - Application Flow & Instructions

## Overview
This document outlines the frontend architecture, page flow, and API integration for the Watch Service Center application.

## Tech Stack
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS (for premium, responsive design)
- **Routing**: React Router DOM
- **State Management**: React Context / Hooks (or Zustand/Redux if complex)
- **HTTP Client**: Axios
- **Icons**: Lucide React / Heroicons

## Application Flow

### 1. Authentication
- **Page**: `LoginPage`
- **Route**: `/login`
- **API**: `POST /api/v1/auth/login`
- **Action**: User enters credentials. On success, store JWT token in localStorage/Context and redirect to Dashboard.

### 2. Dashboard (Home)
- **Page**: `DashboardPage`
- **Route**: `/` (Protected)
- **Features**:
    - Overview of Jobs (Recent/Active).
    - Quick Actions: "New Job", "Search".
    - Stats (if available or calculated).
- **API**:
    - `GET /api/v1/jobs` (List jobs, filter by status).
    - `GET /api/v1/auth/me` (User info).

### 3. Job Management (Core Flow)

#### A. Create New Job (Wizard/Stepped Flow)
- **Page**: `CreateJobPage`
- **Route**: `/jobs/new`
- **Steps**:
    1.  **Customer Selection**:
        - Search existing: `GET /api/v1/customers?search=...`
        - Create new: `POST /api/v1/customers`
    2.  **Job Details**:
        - Create Job linked to Customer: `POST /api/v1/jobs`
        - Fields: Estimated Delivery, Notes.
    3.  **Watch Details**:
        - Create Watch linked to Job: `POST /api/v1/watches`
        - Fields: Brand (`GET /api/v1/brands/all`), Model, Serial, UCP Rate.
    4.  **Conditions & Complaints**:
        - Fetch Nodes: `GET /api/v1/conditions/nodes`, `GET /api/v1/complaints/nodes`
        - Select & Attach:
            - `POST /api/v1/conditions/watch-conditions/batch`
            - `POST /api/v1/complaints/watch-complaints/batch`
    5.  **Attachments (Photos)**:
        - Upload Watch Images: `POST /api/v1/watches/{id}/attachments`

#### B. Job List
- **Page**: `JobListPage`
- **Route**: `/jobs`
- **API**: `GET /api/v1/jobs` (Pagination, Filtering).

#### C. Job Details
- **Page**: `JobDetailsPage`
- **Route**: `/jobs/:jobId`
- **Features**:
    - View all details (Customer, Watch, Status, History).
    - Update Status: `POST /api/v1/jobs/{id}/status`
    - Add Delay: `POST /api/v1/jobs/{id}/delay`
    - Print/View Invoice (Future).
- **API**:
    - `GET /api/v1/jobs/{id}`
    - `GET /api/v1/watches/job/{jobId}`
    - `GET /api/v1/customers/{id}`

### 4. Inventory / Indents (Secondary)
- **Page**: `IndentListPage`
- **Route**: `/indents`
- **API**: `GET /api/v1/indents`
- **Actions**: Create Indent for parts.

### 5. Global Search
- **Component**: `GlobalSearchBar` (in Navbar)
- **API**: `GET /api/v1/search?q=...`

## Folder Structure
```
src/
  assets/
  components/
    common/       # Buttons, Inputs, Modals
    layout/       # Navbar, Sidebar, Layout
    features/     # JobCard, CustomerForm, etc.
  pages/          # Login, Dashboard, CreateJob, JobDetails
  services/       # api.js (Axios setup), authService.js, jobService.js
  context/        # AuthContext
  hooks/          # useAuth, useJobs
  utils/          # formatters, constants
  App.jsx
  main.jsx
```

## Development Steps
1.  **Setup**: Initialize Vite + Tailwind.
2.  **Auth**: Implement Login and Auth Guard.
3.  **Layout**: Create Main Layout (Sidebar/Nav).
4.  **Dashboard**: Fetch and display dummy/real jobs.
5.  **Create Job Flow**: Implement the multi-step form.
6.  **Job Details**: View and Edit functionality.
