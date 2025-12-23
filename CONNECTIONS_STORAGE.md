# Connection Storage - Implementation Guide

## Overview

The MongoDB Aggregation Pipeline Builder now supports secure storage of MongoDB connection strings using encrypted session cookies. This allows users to save their frequently-used connections and quickly reconnect without re-entering credentials.

## Security Implementation

### Encryption & Storage
- **Library**: [iron-session](https://github.com/vvo/iron-session) - industry-standard session management
- **Encryption**: AES-256-GCM encryption for session data
- **Storage**: HTTP-only, secure cookies (not accessible via JavaScript)
- **Expiration**: 30-day cookie lifetime with automatic cleanup

### Security Features
1. **HTTP-Only Cookies**: Prevents XSS attacks by making cookies inaccessible to client-side JavaScript
2. **Secure Flag**: Cookies only transmitted over HTTPS in production
3. **SameSite Protection**: Prevents CSRF attacks with `lax` SameSite policy
4. **Encrypted Storage**: Connection strings are encrypted before being stored in cookies
5. **No Database Required**: All data stored client-side, no server-side database exposure

## Setup Instructions

### 1. Install Dependencies
```bash
npm install iron-session
```

### 2. Configure Environment Variables
Create a `.env.local` file with a secure session secret:

```bash
# Generate a secure random secret (at least 32 characters)
openssl rand -base64 32

# Add to .env.local
SESSION_SECRET=your-generated-secret-here
```

**IMPORTANT**:
- Never commit `.env.local` to version control
- Use a different secret for each environment (dev, staging, production)
- Minimum 32 characters for adequate security

### 3. Configuration Files

#### [src/lib/session.ts](src/lib/session.ts)
Core session configuration and type definitions:
- `SavedConnection` interface - defines connection data structure
- `SessionData` interface - defines session storage schema
- `sessionOptions` - iron-session configuration
- `ensureSessionData()` - helper to initialize session structure

## API Endpoints

### POST `/api/connections/save`
Saves a new connection to the session.

**Request Body:**
```json
{
  "name": "Production Cluster",
  "connectionString": "mongodb+srv://user:pass@cluster.mongodb.net/",
  "defaultDatabase": "myapp"
}
```

**Response:**
```json
{
  "success": true,
  "connection": {
    "id": "abc123...",
    "name": "Production Cluster",
    "defaultDatabase": "myapp",
    "createdAt": 1234567890,
    "lastUsed": 1234567890
  }
}
```

### GET `/api/connections/list`
Lists all saved connections (without connection strings for security).

**Response:**
```json
{
  "success": true,
  "connections": [
    {
      "id": "abc123...",
      "name": "Production Cluster",
      "defaultDatabase": "myapp",
      "createdAt": 1234567890,
      "lastUsed": 1234567890
    }
  ]
}
```

### POST `/api/connections/load`
Loads a specific connection's full details (including connection string).

**Request Body:**
```json
{
  "id": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "connection": {
    "id": "abc123...",
    "name": "Production Cluster",
    "connectionString": "mongodb+srv://...",
    "defaultDatabase": "myapp",
    "createdAt": 1234567890,
    "lastUsed": 1234567890
  }
}
```

### POST `/api/connections/delete`
Deletes a saved connection.

**Request Body:**
```json
{
  "id": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection deleted successfully"
}
```

## User Interface

### ConnectionPanel Component
Located at [src/components/ConnectionPanel/ConnectionPanel.tsx](src/components/ConnectionPanel/ConnectionPanel.tsx)

#### New Features:
1. **"Saved Connections" Button**: Opens dialog to view and manage saved connections
2. **Save Icon Button**: Appears when connected, allows saving current connection
3. **Saved Connections Dialog**: Lists all saved connections with:
   - Connection name
   - Default database (if set)
   - Last used timestamp
   - Delete button for each connection
4. **Save Connection Dialog**: Simple form to name a new saved connection

#### User Flow:
1. User enters connection string and tests connection
2. After successful connection, "Save" button appears
3. User clicks save, enters a memorable name
4. Connection saved to encrypted session cookie
5. Next visit: User clicks "Saved Connections" and selects from list
6. Connection loads and auto-connects

## Data Structure

### SavedConnection Object
```typescript
interface SavedConnection {
  id: string;                    // Unique identifier (random hex)
  name: string;                  // User-provided name
  connectionString: string;      // Encrypted MongoDB URI
  defaultDatabase?: string;      // Optional default database
  createdAt: number;            // Timestamp (milliseconds)
  lastUsed: number;             // Timestamp (milliseconds)
}
```

### Session Storage Schema
```typescript
interface SessionData {
  savedConnections: SavedConnection[];
}
```

## Cookie Details

- **Name**: `mongodb-pipeline-builder-session`
- **Max Age**: 2,592,000 seconds (30 days)
- **Attributes**:
  - `httpOnly: true` - Not accessible via JavaScript
  - `secure: true` (production only) - HTTPS only
  - `sameSite: 'lax'` - CSRF protection
  - `path: '/'` - Available across entire app

## Security Considerations

### What's Protected ✅
- Connection strings encrypted at rest in cookies
- HTTP-only cookies prevent XSS theft
- Secure flag prevents MITM on production
- SameSite prevents CSRF attacks
- No server-side storage = no database breach risk

### What's NOT Protected ⚠️
- **Browser Access**: Anyone with physical access to the browser can use saved connections
- **Shared Devices**: Not recommended for shared/public computers
- **Cookie Theft**: If attacker gains cookie access, they can decrypt connections
- **Network Sniffing**: Use HTTPS in production (enforced by secure flag)

### Best Practices for Users
1. Only save connections on personal, trusted devices
2. Use strong, unique passwords for MongoDB
3. Enable IP whitelisting on MongoDB Atlas
4. Rotate credentials regularly
5. Clear browser data when leaving public computer

### Best Practices for Deployment
1. Always set strong `SESSION_SECRET` in production
2. Ensure HTTPS is configured (automatically sets secure flag)
3. Consider adding session expiry warnings
4. Monitor for suspicious connection patterns
5. Implement rate limiting on API endpoints

## Troubleshooting

### "Failed to save connection"
- Check that `SESSION_SECRET` is set in environment variables
- Ensure cookies are enabled in browser
- Verify cookie size limits (sessions have ~4KB limit per cookie)

### Connections not persisting
- Check cookie expiration (30 days by default)
- Verify browser not in incognito/private mode
- Ensure `secure` flag matches environment (HTTP in dev, HTTPS in prod)

### Session data corrupted
- Invalid `SESSION_SECRET` changed between sessions
- Cookie manually edited or corrupted
- Browser cookie storage corruption
- **Solution**: Clear browser cookies for the app domain

## Future Enhancements

### Potential Improvements
1. **Connection Validation**: Test saved connections on load to verify they're still valid
2. **Export/Import**: Allow users to export/import connection profiles
3. **Cloud Sync**: Optional backend storage for cross-device synchronization
4. **Connection Groups**: Organize connections by environment (dev, staging, prod)
5. **Connection Sharing**: Generate shareable links (without credentials) for team collaboration
6. **Biometric Lock**: Require fingerprint/face ID to load connections on supported devices
7. **Session Timeout Warning**: Notify user before session expires
8. **Connection Health Monitoring**: Track connection success rates and performance

### Migration Path to Database Storage
If you need to move from cookie storage to database storage:

1. Create a `user_connections` table/collection
2. Add authentication (OAuth, JWT, etc.)
3. Migrate API endpoints to query database instead of session
4. Keep cookie-based storage as fallback for anonymous users
5. Add sync logic to keep both in sync during transition

## Testing

### Manual Testing Checklist
- [ ] Save a new connection with name and connection string
- [ ] Verify connection appears in "Saved Connections" list
- [ ] Load a saved connection and verify it connects successfully
- [ ] Delete a saved connection and verify it's removed
- [ ] Close browser and reopen - verify connections persist
- [ ] Test with multiple saved connections
- [ ] Test error handling (invalid connection strings, network errors)
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test in production with HTTPS

### Security Testing
- [ ] Verify cookies have `httpOnly` flag
- [ ] Verify cookies have `secure` flag in production
- [ ] Verify connection strings are encrypted in cookie
- [ ] Test that session expires after 30 days
- [ ] Verify SameSite attribute is set correctly
- [ ] Test that invalid SESSION_SECRET prevents decryption

## References

- [iron-session Documentation](https://github.com/vvo/iron-session)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Web Security Best Practices](https://owasp.org/www-project-web-security-testing-guide/)
- [HTTP Cookie Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security)
