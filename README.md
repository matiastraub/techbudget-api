# 💸 Tech Budget API

A robust and secure **Node.js RESTful API** built for managing budgets and tracking expenses. Designed with modularity, scalability, and real-time streaming in mind, this API supports **advanced query features**, **JWT-based authentication**, and **Server-Sent Events (SSE)** for live data updates.

---

## 🚀 Features

### ✅ Core Capabilities

- RESTful CRUD API for budget tracking
- Modular folder structure for maintainability
- Real-time updates via Server-Sent Events (SSE)
- MongoDB with Mongoose for data persistence
- Environment-based config support

### 🔍 Query Capabilities

Supports advanced filtering and query customization:

- **Field selection:** `?select=name,amount`
- **Sorting:** `?sort=createdAt` or `?sort=-amount`
- **Pagination:** `?page=2&limit=10`
- **Operators:**  
  `gt`, `gte`, `lt`, `lte`, `in` (e.g. `?amount[gt]=1000`)

### 🔐 Security Features

- 🔑 JWT Authentication & Protected Routes
- 🧼 XSS Protection (`xss-clean`)
- 🛡️ HTTP Headers Security with `helmet`
- 🧽 NoSQL Injection Sanitization (`express-mongo-sanitize`)
- 🧊 Rate Limiting to mitigate abuse
- 🌐 CORS enabled for cross-origin requests

---

```
TechBudgetAPI/
├── config/ # App configuration
│ └── config.env # Your environment variables (rename from env.env)
├── controllers/ # Business logic for each route
├── middleware/ # Authentication, error handling, etc.
├── models/ # Mongoose data models
├── routes/ # API route definitions
├── utils/ # Utility functions
├── server.js # Main server entry point
└── README.md # Project documentation
```

---

## ⚙️ Getting Started

### 📦 Installation

```bash
git clone https://github.com/matiastraub/tech-budget-api.git
cd tech-budget-api
npm install
```

🛠️ Environment Setup
Rename the example env file:

```bash
mv config/env.env config/config.env
```

Update config/config.env with your values:

```bash
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_secret_key
```

🧪 Run the App
🚧 Development Mode

```bash
npm run dev
```

🚀 Production Mode

```bash
npm start
```

📡 API Overview
Base URL: /api/v1

```
Method Endpoint Description
GET /transactions Get all transactions
POST /transactions Create a new transaction
GET /transactions/:id Get transaction by ID
PUT /transactions/:id Update a transaction
DELETE /transactions/:id Delete a transaction
GET /stream Live updates via SSE
POST /auth/register Register new user
POST /auth/login User login (JWT issued)
```

🔄 Server-Sent Events (SSE)
Enable real-time features by listening to the /stream endpoint.

Example (JavaScript client):

```bash
const eventSource = new EventSource('/api/v1/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Live update:', data);
};
```

🧾 Version & License
Version: 1.0.0

License: GPL-2.0🧾 Version & License
Version: 1.0.0

License: GPL-2.0

🤝 Contributing
We welcome community contributions!
Feel free to fork, submit pull requests, or open issues for suggestions or bugs.

📬 Contact
Have questions or want to collaborate?

📧 Email: matias.traub@gogogol.com

🌐 Website: https://www.thinkbudget.one
