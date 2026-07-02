#  Multi-Tenant SaaS Task Management System

##  Overview

This project is a full-stack multi-tenant SaaS application that allows multiple organizations (tenants) to manage users, tasks, and workflows securely within a shared system.

Each tenant’s data is isolated to ensure security while maintaining a scalable backend architecture.

##  Architecture

- **Frontend**: React (Vite)  
- **Backend**: Node.js + Express  
- **Database**: MongoDB (Mongoose)  
- **Caching**: Redis  
- **Authentication**: JWT  
- **Deployment**: Docker

## Architecture Diagram
   <img width="3770" height="1361" alt="mermaid-diagram (2)" src="https://github.com/user-attachments/assets/0f84024c-4a7f-44ac-aa5b-72b24147e1c2" />


##  Core Features

- Multi-tenant architecture with secure data isolation  
- User authentication using JWT  
- Role-Based Access Control (RBAC)  
- Task and project management APIs  
- Middleware-based request validation and authorization  
- Redis caching for improved performance  
- Backend testing using Jest  

##  Tenant Isolation Strategy

Each request is associated with a tenant ID, and all database operations are scoped using this identifier.

This ensures:
- Strict separation of tenant data  
- No cross-tenant access  
- Secure multi-organization support  

##  Tech Stack

- Node.js, Express.js  
- MongoDB with Mongoose  
- Redis  
- React (Vite)  
- JWT (Authentication)  
- bcrypt (Password hashing)  
- Jest (Testing)  
- Docker  

##  Getting Started

### 1. Clone the repository
git clone <your-repo-url>
cd multi-tenant-saas

### 2. Setup environment variables

cp .env.example .env

### 3. Run using Docker
docker compose up --build

##  API Overview

- Authentication (Login/Register)  
- Task management (Create, Update, Delete)  
- Role-based access endpoints  

All protected routes require a valid JWT token.

##  Key Learnings

- Designed a multi-tenant backend with secure data isolation  
- Implemented RBAC and authentication in a scalable system  
- Integrated Redis for caching and performance improvement  
- Built and tested REST APIs using Jest  
- Containerized services using Docker  

##  Future Improvements
- Refresh token implementation  
- Advanced tenant-level rate limiting  
- API documentation (Swagger)  
