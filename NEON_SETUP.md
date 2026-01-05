# Neon Database Setup for Bruin Tutors

## Your Neon Project

- **Project Name**: Bruin Tutors
- **Project ID**: `dark-firefly-86162746`
- **Region**: AWS US West 2 (Oregon)
- **Branches**: 
  - `production` (default)
  - `development`

## Connection String

Add this to your `.env.local` file:

```env
DATABASE_URL="postgresql://neondb_owner:npg_srW8oXxCOnk3@ep-odd-lake-af5d7mjj-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
```

**⚠️ Security Note**: This connection string contains your database password. Keep it secure and never commit it to version control. The `.env.local` file is already in `.gitignore`.

## Setup Steps

1. **Add the connection string to `.env.local`**:
   ```bash
   # Create .env.local if it doesn't exist
   echo 'DATABASE_URL="postgresql://neondb_owner:npg_srW8oXxCOnk3@ep-odd-lake-af5d7mjj-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"' >> .env.local
   ```

2. **Run Prisma migration** to create the database tables:
   ```bash
   npx prisma migrate dev --name init
   ```
   
   This will:
   - Create all tables (User, Account, Session, VerificationToken, Profile)
   - Generate the Prisma Client
   - Apply the migration to your Neon database

3. **Verify the migration**:
   ```bash
   npx prisma studio
   ```
   
   This opens a browser interface where you can view your database tables.

## Using Different Branches

If you want to use the `development` branch instead of `production`, you can:

1. Get the connection string for the development branch:
   - Use the Neon Console to get the connection string for the `development` branch
   - Or modify the connection string to use the development branch endpoint

2. Update your `.env.local` with the development branch connection string

## Next Steps

After setting up the database:

1. Complete the authentication setup (see `AUTH_SETUP.md`):
   - Add `NEXTAUTH_SECRET`
   - Add `NEXTAUTH_URL`
   - Add Google OAuth credentials

2. Test the authentication flow:
   - Start your dev server: `npm run dev`
   - Visit `/login` and sign in with Google
   - Check that a user record is created in the database

## Troubleshooting

### Connection timeout
- Ensure your IP is not blocked (Neon allows all IPs by default)
- Check that `sslmode=require` is in the connection string

### Migration fails
- Verify the `DATABASE_URL` is correct
- Check that the database is accessible
- Ensure Prisma Client is generated: `npx prisma generate`

### Need to reset the database
If you need to start fresh:
```bash
npx prisma migrate reset
```
This will drop all tables and re-run migrations.

