# Backend Database & Environment Setup Guide

Install Node.js Dependencies

Initialize `package.json` and install the required packages (`mysql2`, `express-rate-limit`, `cookie-parser`, `helmet`, etc)...

### Auth Server (`port 4000`)
```powershell
cd auth-server
npm init -y
npm install express mysql2 dotenv cors helmet cookie-parser express-rate-limit jsonwebtoken bcryptjs
```

### Blog API Server (`port 5000`)
```powershell
cd ..\blog-server
npm init -y
npm install express mysql2 dotenv cors helmet cookie-parser express-rate-limit jsonwebtoken
```

*(Update `"main"` in both `package.json` files to `"server.js"` when configuring your start scripts.)*

---

## Verify Database Connectivity


```powershell
# From auth-server/
node -e "const db = require('./db'); db.query('SELECT * FROM roles').then(([rows]) => { console.log(rows); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"

# From blog-server/
node -e "const db = require('./db'); db.query('SHOW TABLES').then(([rows]) => { console.log(rows); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"
```

## Live-Test:

npm --prefix blog-platform/auth-server start
npm --prefix blog-platform/blog-server start
npm --prefix blog-platform/frontend run dev

---

## Demo Accounts

Registered accounts for basis:

| Role | Email | Username | Password |
| :--- | :--- | :--- | :--- |
| **reader** | `reader@blog.test` | `reader1` | `password123` |
| **author** | `author@blog.test` | `author1` | `password123` |
| **admin** | `admin@blog.test` | `admin1` | `password123` |


## MySQL Issue

W + R -> type services.msc to check for running MySQL servers. Close the running server then run the one in the XAMPP port.
