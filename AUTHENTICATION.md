# Authentication System Implementation

This document describes the authentication system implementation for the Used Books Automation dashboard.

## Overview

The authentication system is built using a combination of:

1. **JWT (JSON Web Tokens)** for secure, stateless authentication
2. **Cookie-based token storage** for improved security
3. **Flash messages** for error/success notifications
4. **Role-based access control** with admin and staff roles
5. **Password hashing** using bcrypt for secure storage

## User Model

For simplicity, the system uses an in-memory user model defined in `src/models/user.js`. In a production environment, this would be replaced with a database model.

The system comes with two predefined users:
- **Admin User**: username: `admin`, password: `admin123`
- **Staff User**: username: `staff`, password: `staff123`

## Authentication Flow

1. User submits login form with username and password
2. Server validates credentials against user model
3. If valid, server generates JWT with user data (excluding password)
4. JWT is stored in an HTTP-only cookie
5. User is redirected to the dashboard
6. On subsequent requests, the auth middleware validates the JWT
7. If the JWT is invalid or expired, user is redirected to the login page

## Middleware

Two main middleware functions are used:

1. **authMiddleware**: Checks for valid JWT in cookies and adds user data to request
2. **isAdmin**: Checks if the authenticated user has admin role for protected routes

## Security Features

1. **HTTP-only cookies**: Prevents client-side JavaScript from accessing the token
2. **Secure cookies in production**: Only sent over HTTPS
3. **Password hashing**: Passwords are never stored in plain text
4. **Failed login logging**: Failed login attempts are logged for security monitoring
5. **CSRF protection**: Connect-flash provides basic CSRF protection
6. **Expiring tokens**: JWTs expire after 24 hours (configurable)

## Environment Variables

The following environment variables are required for the authentication system:

```
AUTH_JWT_SECRET=your_jwt_secret_change_in_production
AUTH_JWT_EXPIRATION=24h
COOKIE_SECRET=your_cookie_secret_change_in_production
SESSION_SECRET=your_session_secret_change_in_production
```

## Directory Structure

```
src/
├── middleware/
│   ├── auth.js           # Authentication middleware
│   └── flash.js          # Flash message middleware
├── controllers/
│   └── authController.js # Authentication controller
├── models/
│   └── user.js           # User model
├── routes/
│   └── auth.js           # Authentication routes
├── views/
│   └── auth/
│       └── login.ejs     # Login page template
└── utils/
    └── sessionStore.js   # Session store configuration
```

## Future Enhancements

1. **Database integration**: Replace in-memory user store with database
2. **Account management**: Add password reset, account creation, profile editing
3. **Two-factor authentication**: Add 2FA support for increased security
4. **OAuth integration**: Support for login via Google, GitHub, etc.
5. **Session management**: Allow users to view and revoke active sessions
6. **Password policies**: Enforce password complexity and rotation
7. **Rate limiting**: Prevent brute force attacks by limiting login attempts

## Usage

To add a new protected route, simply add the `authMiddleware` to the route:

```javascript
// Protected route
app.get('/protected-route', authMiddleware, (req, res) => {
  // This route is protected and only accessible to authenticated users
  res.render('protected-page', { user: req.user });
});

// Admin-only route
app.get('/admin-route', authMiddleware, isAdmin, (req, res) => {
  // This route is protected and only accessible to admin users
  res.render('admin-page', { user: req.user });
});
```

## Authentication API

The following API endpoints are available for authentication:

- `GET /auth/login`: Renders the login page
- `POST /auth/login`: Processes login credentials and creates JWT
- `GET /auth/logout`: Clears the authentication cookie and redirects to login

## Error Handling

The authentication system includes comprehensive error handling:

1. Invalid credentials show a generic error message to prevent username enumeration
2. All authentication errors are logged for monitoring
3. Flash messages provide user feedback for login/logout actions
4. JWT validation errors redirect to login with appropriate messages

## Dashboard Integration

The authentication system integrates with the dashboard to:

1. Show current user info in the sidebar and topbar
2. Restrict sensitive operations to admin users
3. Personalize the dashboard experience based on user role
4. Maintain security across all dashboard interactions

## Testing

You can test the authentication system by:

1. Logging in with the default admin credentials
2. Trying to access admin-only routes as a staff user
3. Logging out and verifying the session is terminated
4. Attempting to access protected routes without authentication
5. Testing CSRF protection by submitting forms without proper tokens

## Performance Considerations

The JWT-based authentication is designed for performance:

1. Stateless operation reduces database load
2. Minimal middleware overhead on each request
3. In-memory caching of user data in the token
4. Efficient validation using fast cryptographic operations

## Troubleshooting

If you encounter authentication issues:

1. Check environment variables are properly set
2. Verify the cookies are being set correctly in the browser
3. Ensure the clock on your server is synchronized (JWTs are time-sensitive)
4. Check for HTTPS/HTTP mismatches with secure cookies
5. Review the logs for detailed error messages