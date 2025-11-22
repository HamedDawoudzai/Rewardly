# CSC309 A2 - Loyalty Rewards Backend

A comprehensive REST API backend for a loyalty rewards program built with Express.js, Prisma, and SQLite.

## Features

- **User Management**: Registration, authentication, profiles, and role-based access control
- **Authentication**: JWT-based auth with password reset functionality
- **Transactions**: Purchases, redemptions, transfers, adjustments, and event awards
- **Events**: Create and manage events with organizers, guests, and point awards
- **Promotions**: Automatic and one-time promotional campaigns
- **Role-Based Authorization**: Four roles (regular, cashier, manager, superuser) with granular permissions

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Create a superuser account
node prisma/createsu.js <utorid> <email> <password>
```

### Environment Variables

Create a `.env` file in the root directory:

```
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Running the Server

```bash
# Start server on specified port
node index.js 3000
```

The server will be available at `http://localhost:3000`.

## Testing

The project includes comprehensive unit tests for all endpoints:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

### Authentication
- `POST /auth/tokens` - Login
- `POST /auth/resets` - Request password reset
- `POST /auth/resets/:resetToken` - Reset password

### Users
- `POST /users` - Create user (Cashier+)
- `GET /users` - List users (Manager+)
- `GET /users/:userId` - Get user (Cashier+)
- `PATCH /users/:userId` - Update user (Manager+)
- `GET /users/me` - Get own profile
- `PATCH /users/me` - Update own profile
- `PATCH /users/me/password` - Change password

### Transactions
- `POST /transactions` - Create purchase/adjustment (Cashier+/Manager+)
- `GET /transactions` - List transactions (Manager+)
- `GET /transactions/:transactionId` - Get transaction (Manager+)
- `PATCH /transactions/:transactionId/suspicious` - Toggle suspicious (Manager+)
- `PATCH /transactions/:transactionId/processed` - Process redemption (Cashier+)
- `POST /users/:userId/transactions` - Transfer points
- `POST /users/me/transactions` - Request redemption

### Events
- `POST /events` - Create event (Manager+)
- `GET /events` - List events
- `GET /events/:eventId` - Get event
- `PATCH /events/:eventId` - Update event (Manager+/Organizer)
- `DELETE /events/:eventId` - Delete event (Manager+)
- `POST /events/:eventId/organizers` - Add organizer (Manager+)
- `DELETE /events/:eventId/organizers/:userId` - Remove organizer (Manager+)
- `POST /events/:eventId/guests` - Add guest (Manager+/Organizer)
- `DELETE /events/:eventId/guests/:userId` - Remove guest (Manager+)
- `POST /events/:eventId/guests/me` - RSVP to event
- `DELETE /events/:eventId/guests/me` - Un-RSVP from event
- `POST /events/:eventId/transactions` - Award event points (Manager+/Organizer)

### Promotions
- `POST /promotions` - Create promotion (Manager+)
- `GET /promotions` - List promotions
- `GET /promotions/:promotionId` - Get promotion
- `PATCH /promotions/:promotionId` - Update promotion (Manager+)
- `DELETE /promotions/:promotionId` - Delete promotion (Manager+)

## Project Structure

```
A2/
├── src/
│   ├── controllers/       # Request handlers
│   │   └── __tests__/    # Controller tests
│   ├── services/         # Business logic
│   ├── repositories/     # Database operations
│   ├── routes/           # Route definitions
│   ├── middleware/       # Auth & permissions
│   └── utils/            # Validation & JWT utilities
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   ├── createsu.js       # Superuser creation script
│   └── seed.js           # Database seeding
├── uploads/
│   └── avatars/          # User avatar uploads
├── index.js              # Application entry point
├── jest.config.js        # Jest configuration
└── package.json          # Dependencies

```

## Business Rules

### Points System
- **Base earn rate**: 1 point per $0.25 spent (rounded to nearest)
- **Suspicious transactions**: Held for manager review before crediting
- **Redemptions**: 1 cent per point
- **Transfers**: Between verified users only

### Promotions
- **Automatic**: Applied automatically when conditions met
- **One-time**: Single use per user, manually applied by cashier

### Events
- Points pool budgeted per event
- Organizers distribute points to confirmed guests
- Organizers and guests are mutually exclusive

## Error Handling

All errors return JSON in the format:
```json
{
  "error": "Error message"
}
```

HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict
- `410` - Gone
- `429` - Too Many Requests

## License

ISC
