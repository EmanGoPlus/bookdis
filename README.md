# Fullstack Business Management Platform

A multi-platform application stack for merchants, customers, and admins with a backend powered by Fastify and PostgreSQL.  
This project includes:  
- **Merchant App** (React Native)  
- **Customer App** (React Native)  
- **Admin Web App** (React)  
- **Backend API** (Node.js + Fastify + Drizzle ORM + PostgreSQL)  

---

## Tech Stack
- **Frontend:** React, React Native  
- **Backend:** Node.js, Fastify  
- **ORM:** Drizzle ORM  
- **Database:** PostgreSQL
- https://psgc.cloud/ for address api 

---

## Installation & Running

Clone the repository and install dependencies for each app:

```bash
# Merchant App
cd merchantApp
npm install
npm run dev

# Customer App
cd customerApp
npm install
npm run dev

# Admin Web
cd adminWeb
npm install
npm run dev

# Backend API
cd backend
npm install
npm run dev

# Generate migration files
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate

root/
 ├── merchantApp/   # React Native app for merchants
 ├── customerApp/   # React Native app for customers
 ├── adminWeb/      # React web app for admins
 └── backend/       # Fastify + Drizzle ORM + PostgreSQL backend

 # If ecnountering Network Error:
 # 1. Open CMD
 # 2. ipconfig
 # 3. Copy IPV4 address
 # 4. Open ipConfig.js
 # 2. change the ip address

