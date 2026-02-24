# Moi Panam Manager

A full-stack web application for managing family finances with multilingual support, voice input, and location-based aggregation.

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT with role-based access

## Features

- Multilingual name support
- Voice input using Web Speech API
- Denomination-wise cash entry
- Location-based aggregation
- Duplicate name detection
- Filters and sorting
- Excel export

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Set up environment variables (see `.env.example` files)
5. Run database migrations
6. Start the development servers

### Development

- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm start`

## Deployment

This application is structured for cloud deployment (AWS, GCP, Azure, etc.)

## License

MIT
