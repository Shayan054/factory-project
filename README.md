# Factory Management System

A full-stack, enterprise-grade Industrial & Factory ERP / Management System built with **Django REST Framework** and **React (TypeScript)**. This application provides real-time tracking for multi-role operations, inventory management, production Bill of Materials (BOM), billing, expense auditing, and financial reporting.

---

## Overview

The **Factory Management System** solves the operational challenge of managing raw material inventory, production output, customer orders, and financial accounting in manufacturing facilities. By linking production BOM directly to raw material stocks and customer orders to billing ledger balances, the system eliminates manual discrepancy in stock counts and revenue accounting.

---

## Features

- **Role-Based Access Control (RBAC)**: Enforces strict permission levels for **CEO** (full system management, user registration, records modification/deletion) and **Manager** (entry and viewing rights).
- **Bill of Materials (BOM) Production**: Automatically calculates required raw materials for product assembly and auto-deducts inventory when production quantities increase.
- **Order & Inventory Tracking**: Workflow management for customer orders from pending status to completion with real-time stock availability verification.
- **Automated Billing & Accounts Receivable**: Dynamic invoice generation, tracking of amounts received, pending balances, and payment dates upon order completion.
- **Expense Categorization & Automated Purchase Auditing**: Auto-generates expense entries upon raw material acquisition and categorizes operational costs.
- **Analytics Dashboard**: Dynamic metrics showing monthly/annual sales, revenue collected, outstanding balances, order status counts, and historical sales trends.
- **Client-Side Guest / Demo Mode**: Integrated browser fallback mock API allowing recruiters and evaluators to test all features without requiring backend database connectivity.
- **PDF Report Generation**: Exportable structured PDF summaries for financial audits, expense reports, and customer order histories using `jspdf`.

---

## Tech Stack

### Frontend
- **Framework**: React 19 (TypeScript, Vite)
- **Styling**: TailwindCSS v4
- **State & Routing**: React Router v7, React Context API
- **Charts & Reporting**: Recharts, jsPDF, jsPDF-AutoTable
- **UI Components**: Datepicker, Lucide Icons

### Backend
- **Framework**: Django 3.2, Django REST Framework (DRF)
- **Authentication**: JWT (`djangorestframework-simplejwt`, `PyJWT`)
- **Database**: PostgreSQL (`psycopg2-binary`, `dj-database-url`)
- **Static Assets & Server**: WhiteNoise, Gunicorn

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React 19 Frontend                     │
│    (Context API State / Protected Routes / Recharts)    │
└────────────────────────────┬────────────────────────────┘
                             │ REST API / JWT
                             ▼
┌─────────────────────────────────────────────────────────┐
│             Django REST Framework Backend               │
│   (JWT Auth Middleware / RBAC Permissions / Custom User)│
└────────────────────────────┬────────────────────────────┘
                             │ ORM
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                    │
│     (Employees, Products, BOM, Orders, Billing, Expenses)│
└─────────────────────────────────────────────────────────┘
```

---

## Key Workflows

1. **Authentication & Authorization**: Users log in via email and receive short-lived JWT access tokens and refresh tokens. Requests evaluate employee role (`CEO` vs `MANAGER`) at both route and ViewSet level.
2. **Raw Material Acquisition & Expense Creation**: Adding raw material stock updates inventory records while atomically creating a linked expense entry under the corresponding material category.
3. **Product BOM Assembly**: Products are associated with specified quantities of raw materials. Updating product stock checks raw material availability and deducts stock inside atomic database transactions.
4. **Order Fulfillment & Billing**: Placing an order checks inventory levels. Marking an order as completed automatically initializes or updates the billing ledger, recording payments and open balances.

---

## Screenshots

> *Placeholder: Add application screenshots here*

| Dashboard Overview | Production & Orders | Billing & Financial Reports |
|:---:|:---:|:---:|
| *(Screenshot Placeholder)* | *(Screenshot Placeholder)* | *(Screenshot Placeholder)* |

---

## Demo

- **Live Application**: `[Insert Live Demo URL Here]`
- **Guest / Demo Mode**: The application includes a built-in client-side mock store (`demoApi.ts`). If the backend server is unreachable or if launched in preview mode, users can explore all modules seamlessly.

---

## Project Structure

```
factory-project/
├── backend/
│   └── factory/
│       ├── fact_app/          # Core Django app (models, views, permissions, serializers)
│       │   ├── models.py      # Custom Employee model, Order, BOM, Billing schemas
│       │   ├── views.py       # DRF ViewSets with atomic transactions
│       │   ├── permissions.py # Role-based access control rules
│       │   └── auth_views.py  # JWT authentication endpoints
│       ├── factory/           # Project configuration & settings
│       └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable modal and selector components
│   │   ├── context/           # AuthContext & DashboardDataContext
│   │   ├── demo/              # Client-side demo API mock server
│   │   ├── pages/             # Dashboard, Operations, Management, Reports, Login
│   │   ├── utils/             # API request wrappers, PDF generators
│   │   └── AppRoutes.tsx      # Protected route definitions
│   └── package.json
└── README.md
```

---

## Environment Variables

### Backend Configuration (`backend/factory/.env`)

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DJANGO_ENV=local
DB_NAME=factory
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
# DATABASE_URL=postgresql://user:password@host:port/dbname (For production)
```

### Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## Installation

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend/factory

# Create and activate virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Linux/macOS: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy template and edit backend/factory/.env

# Run database migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start development server
npm run dev
```

---

## Security

- **JWT Authentication**: Stateless authentication utilizing HTTP Bearer tokens with token refresh handling.
- **Custom RBAC Layer**: ViewSet mixins restrict `UPDATE` and `DESTROY` operations strictly to users with the `CEO` role.
- **Database Atomic Transactions**: Material deductions and billing ledgers execute inside `transaction.atomic()` blocks to prevent partial state corruption.
- **Parameterized Queries**: Django ORM queries protect against SQL injection vulnerabilities.

---

## Future Improvements

- Automated Low-Stock Alert System (Email/SMS notifications for raw materials below reorder thresholds).
- Multi-currency support and localized tax calculations for export billing.
- Extended audit logging for inventory adjustment history.

---

## License

*(Placeholder: Choose and insert an appropriate open-source license, e.g., MIT License)*
