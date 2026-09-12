# SamadhanSetu - Frontend

**"Bridging Citizens, Universities & Industry"**

A modern civic collaboration web application where citizens report local community problems, and academic institutions and industry leaders partner to solve them.

---

## 🚀 Tech Stack

- **React 18** (Vite)
- **Tailwind CSS** (Clean Blue & Emerald/Green theme)
- **React Router v6** (Client-side routing)
- **Axios** (REST API requests with automatic JWT Bearer token authentication)

---

## 🛠️ How to Run Locally

### 1. Install Node.js
If you don't already have Node.js installed, download and install the LTS version from [nodejs.org](https://nodejs.org/).

### 2. Install Dependencies
Open your terminal in this directory and run:
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The app will open automatically at:
```
http://localhost:5173
```

---

## 🌐 Connected Backend API Specification

The frontend connects to `http://localhost:5000/api` with the following contract:

| Endpoint | Method | Role / Description |
| :--- | :---: | :--- |
| `/auth/login` | `POST` | Authenticates citizen, university, or industry `{ email, password, role }` |
| `/auth/register` | `POST` | Registers new user `{ name, email, password, role }` |
| `/problems` | `GET` | Retrieves problem list |
| `/problems` | `POST` | Citizen submits new problem `{ title, description, location, imageUrl }` |
| `/problems/:id/assign` | `PUT` | University assigns problem to itself |
| `/problems/:id/status` | `PUT` | Updates status `{ status }` (pending / assigned / in_progress / solved) |
