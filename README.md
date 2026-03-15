# Match Updates API & WebSocket Server

A real-time match commentary system built with Node.js, Express, and WebSockets. This application allows users to create matches, post real-time commentary updates, and subscribe to match updates via WebSockets.

## 🚀 Features

- **REST API**: Manage matches and commentaries with Express.
- **Real-time Updates**: Subscribe to specific matches via WebSockets to receive instant commentary updates.
- **Database**: PostgreSQL with Drizzle ORM for efficient data management and migrations.
- **Security**:
  - **Arcjet Integration**: Shield protection, bot detection, and rate limiting for both HTTP and WebSocket connections.
- **Validation**: Schema-based validation using Zod.
- **Development Workflow**: Automated migrations and schema generation with Drizzle-kit.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express (v5.x)
- **WebSocket**: `ws` library
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (via `pg`)
- **Security**: Arcjet
- **Validation**: Zod
- **Package Manager**: pnpm

## 📁 Project Structure

```text
src/
├── controllers/    # Request handlers for matches and commentary
├── db/             # Database connection and schema definitions
├── routes/         # Express API routes
├── utils/          # Helper utilities and constants
├── validation/     # Zod schemas for request validation
├── ws/             # WebSocket server implementation and logic
├── arcjet.js       # Arcjet security configuration
└── index.js        # Main entry point: Server & HTTP setup
drizzle/            # Drizzle migrations and metadata
```

## ⚙️ Getting Started

### Prerequisites

- Node.js installed
- PostgreSQL database
- pnpm package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Configure environment variables (create a `.env` file):
   ```env
   PORT=3000
   DATABASE_URL=postgres://user:password@localhost:5432/dbname
   ARCJET_KEY=your_arcjet_key
   ARCJET_MODE=LIVE # or DRY_RUN
   ```

### Database Setup

Run the following commands to set up your database schema:

```bash
# Generate migrations
pnpm db:generate

# Apply migrations to the database
pnpm db:migrate
```

### Running the Application

- **Development mode** (with auto-reload):
  ```bash
  pnpm dev
  ```
- **Production mode**:
  ```bash
  pnpm start
  ```

## 📡 API Endpoints

### HTTP (REST)

- **GET `/`**: Welcome message.
- **GET `/api/match`**: List all matches.
- **POST `/api/match`**: Create a new match.
- **GET `/api/match/:id/commentary`**: Get commentary for a specific match.
- **POST `/api/match/:id/commentary`**: Add commentary to a specific match.

### WebSockets

- **Endpoint**: `ws://localhost:3000/ws`
- **Actions**:
  - **Subscribe**: `{ "type": "subscribe", "matchId": 1 }`
  - **Unsubscribe**: `{ "type": "unsubscribe", "matchId": 1 }`
- **Notifications**: Broadcasts new commentary updates to all subscribed clients of a match.

## 🛡️ Security

This project uses **Arcjet** to protect against common web vulnerabilities:

- **Rate Limiting**: Preventing abuse on API endpoints and WebSocket messages.
- **Bot Detection**: Filtering out automated malicious traffic.
- **Shield**: Protecting against common attacks like SQL injection and cross-site scripting.

## 📜 License

This project is licensed under the [ISC License](LICENSE).
