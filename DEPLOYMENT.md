# Deployment Guide - Swasthik Salon Customer Management

This guide will help you deploy the Swasthik Salon Customer Management System for free using Vercel and a free database service.

## Option 1: Vercel + PlanetScale (Recommended)

### Step 1: Set up PlanetScale Database

1. Go to [PlanetScale](https://planetscale.com/)
2. Sign up for a free account
3. Create a new database
4. Get your database connection string
5. Update your Prisma schema to use MySQL:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Step 2: Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import your GitHub repository
4. Add environment variables:
   - `DATABASE_URL`: Your PlanetScale connection string
   - `NEXTAUTH_URL`: Your Vercel app URL
   - `NEXTAUTH_SECRET`: Generate a random secret

5. Deploy!

## Option 2: Vercel + Supabase

### Step 1: Set up Supabase Database

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Update your Prisma schema to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 2: Deploy to Vercel

Same as Option 1, but use the Supabase connection string.

## Option 3: Railway (All-in-one)

1. Go to [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Railway will automatically detect Next.js and set up the database
4. Add environment variables in Railway dashboard
5. Deploy!

## Environment Variables

**For Local Development (.env.local):**
```env
# REQUIRED: Set your own secure credentials
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@domain.com
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_admin_password
NEXT_PUBLIC_RECEPTION_EMAIL=your_reception_email@domain.com
NEXT_PUBLIC_RECEPTION_PASSWORD=your_secure_reception_password

# Optional: Database
DATABASE_URL="your-database-connection-string"
```

**For Production (Vercel):**
- Set the same variables in Vercel dashboard
- Use strong, unique passwords
- Never commit actual credentials to Git

## Post-Deployment Setup

After deployment, you need to set up credentials:

1. Go to your deployed app
2. **Set up your credentials in Vercel dashboard:**
   - Go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_ADMIN_EMAIL` = your admin email
   - Add: `NEXT_PUBLIC_ADMIN_PASSWORD` = your secure admin password
   - Add: `NEXT_PUBLIC_RECEPTION_EMAIL` = your reception email
   - Add: `NEXT_PUBLIC_RECEPTION_PASSWORD` = your secure reception password
3. **Redeploy** your app to apply the new credentials
4. Login with your custom credentials
5. Start adding your customer data!

## Free Tier Limits

### Vercel
- 100GB bandwidth per month
- Unlimited static deployments
- Serverless functions

### PlanetScale
- 1 billion row reads per month
- 1 billion row writes per month
- 5GB storage

### Supabase
- 500MB database
- 1GB file storage
- 2GB bandwidth

## Custom Domain (Optional)

1. Buy a domain from any registrar
2. In Vercel dashboard, go to your project settings
3. Add your domain
4. Update DNS records as instructed
5. Your app will be available at your custom domain!

## Monitoring and Maintenance

- Monitor your usage in the respective dashboards
- Set up alerts for approaching limits
- Regular backups are handled automatically by the database providers
- Update dependencies regularly for security

## Troubleshooting

### Database Connection Issues
- Check your connection string format
- Ensure your database is accessible from Vercel
- Verify environment variables are set correctly

### Build Failures
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript compilation

### File Upload Issues
- Check if uploads directory exists
- Verify file size limits
- Check Vercel function timeout settings

## Support

For deployment issues:
1. Check the Vercel documentation
2. Check your database provider's documentation
3. Review the build logs for specific errors

## Security Notes

- Change default passwords immediately
- Use strong, unique passwords
- Enable 2FA where possible
- Regularly update dependencies
- Monitor access logs

Your Swasthik Salon Customer Management System is now ready for production use!
