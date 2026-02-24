# Moi Panam Manager - Project Structure

```
Project 1/
│
├── README.md
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   │
│   └── src/
│       ├── server.js
│       ├── app.js
│       │
│       ├── routes/
│       │   ├── index.js
│       │   ├── auth.routes.js
│       │   ├── entry.routes.js
│       │   ├── location.routes.js
│       │   └── export.routes.js
│       │
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── entry.controller.js
│       │   ├── location.controller.js
│       │   └── export.controller.js
│       │
│       ├── services/
│       │   ├── auth.service.js
│       │   ├── entry.service.js
│       │   ├── location.service.js
│       │   ├── export.service.js
│       │   └── duplicateDetection.service.js
│       │
│       ├── models/
│       │   ├── user.model.js
│       │   ├── entry.model.js
│       │   └── location.model.js
│       │
│       ├── middlewares/
│       │   ├── auth.js
│       │   ├── validators.js
│       │   └── errorHandler.js
│       │
│       ├── database/
│       │   ├── connection.js
│       │   ├── migrations/
│       │   │   └── 001_create_tables.sql
│       │   └── seeds/
│       │       └── seed.sql
│       │
│       ├── utils/
│       │   └── logger.js
│       │
│       └── config/
│           └── index.js
│
└── frontend/
    ├── package.json
    ├── .env.example
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        │
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   └── Entries.jsx
        │
        ├── components/
        │   └── PrivateRoute.jsx
        │
        ├── context/
        │   └── AuthContext.jsx
        │
        ├── services/
        │   ├── api.js
        │   ├── authService.js
        │   ├── entryService.js
        │   └── exportService.js
        │
        └── utils/
            └── voiceInput.js
```

## Directory Descriptions

### Backend

- **routes/**: API endpoint definitions
- **controllers/**: Request handlers and response logic
- **services/**: Business logic layer
- **models/**: Database models and queries
- **middlewares/**: Authentication, validation, error handling
- **database/**: Database connection, migrations, and seeds
- **utils/**: Helper utilities (logging, etc.)
- **config/**: Configuration management

### Frontend

- **pages/**: Main page components
- **components/**: Reusable UI components
- **context/**: React Context for state management
- **services/**: API integration layer
- **utils/**: Helper utilities (voice input, etc.)

## Next Steps

1. Copy `.env.example` to `.env` in both frontend and backend
2. Configure database credentials
3. Install dependencies: `npm install` in both directories
4. Run migrations to set up database
5. Start development servers
