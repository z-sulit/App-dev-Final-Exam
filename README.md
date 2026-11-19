# Backend Database & Environment Setup Guide

Install Node.js Dependencies

Initialize `package.json` and install the required packages (`mysql2`, `express-rate-limit`, `cookie-parser`, `helmet`, plus core server and auth libraries) in both backend servers:

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

## 6. Verify Database Connectivity

Run a quick check from both server directories in PowerShell to confirm Node.js can query MariaDB:

```powershell
# From auth-server/
node -e "const db = require('./db'); db.query('SELECT * FROM roles').then(([rows]) => { console.log(rows); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"

# From blog-server/
node -e "const db = require('./db'); db.query('SHOW TABLES').then(([rows]) => { console.log(rows); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"
```

Once both commands return your seeded roles and table list without errors, the database layer is ready for Express routes, middleware, and controllers.