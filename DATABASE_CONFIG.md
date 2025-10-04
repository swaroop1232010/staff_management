# Database Configuration Guide

This guide shows you exactly where and how to configure different database types for your Swasthik Salon Customer Management System.

## 📍 Where to Configure Database URLs

### 1. Environment Variables (`.env` file)

Create a `.env` file in your project root and add your database URL:

```env
DATABASE_URL="your-database-connection-string"
```

### 2. Prisma Schema (`prisma/schema.prisma`)

Update the `datasource db` section based on your database choice.

## 🗄️ Database Configuration Examples

### MySQL Configuration

#### Step 1: Update Prisma Schema
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

#### Step 2: Environment Variables
```env
# Local MySQL
DATABASE_URL="mysql://root:password@localhost:3306/swasthik_salon"

# Remote MySQL
DATABASE_URL="mysql://username:password@mysql.example.com:3306/swasthik_salon"

# MySQL with SSL
DATABASE_URL="mysql://user:pass@mysql.example.com:3306/swasthik_salon?sslmode=require"

# PlanetScale MySQL
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/swasthik-salon?sslaccept=strict"
```

#### Step 3: Install MySQL Driver
```bash
npm install mysql2
```

### PostgreSQL Configuration

#### Step 1: Update Prisma Schema
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Step 2: Environment Variables
```env
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/swasthik_salon"

# Remote PostgreSQL
DATABASE_URL="postgresql://username:password@postgres.example.com:5432/swasthik_salon"

# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Railway PostgreSQL
DATABASE_URL="postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway"
```

#### Step 3: Install PostgreSQL Driver
```bash
npm install pg
```

### MongoDB Configuration

#### Step 1: Update Prisma Schema
```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
```

#### Step 2: Environment Variables
```env
# Local MongoDB
DATABASE_URL="mongodb://localhost:27017/swasthik_salon"

# Remote MongoDB
DATABASE_URL="mongodb://username:password@mongodb.example.com:27017/swasthik_salon"

# MongoDB Atlas
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/swasthik_salon"

# MongoDB with Authentication
DATABASE_URL="mongodb://username:password@localhost:27017/swasthik_salon?authSource=admin"
```

#### Step 3: Install MongoDB Driver
```bash
npm install mongodb
```

## 🚀 Free Database Services

### 1. PlanetScale (MySQL)
- **Free Tier**: 1 billion reads, 1 billion writes, 5GB storage
- **Setup**: 
  1. Sign up at [planetscale.com](https://planetscale.com)
  2. Create a new database
  3. Get connection string
  4. Use: `mysql://username:password@aws.connect.psdb.cloud/database-name?sslaccept=strict`

### 2. Supabase (PostgreSQL)
- **Free Tier**: 500MB database, 1GB file storage
- **Setup**:
  1. Sign up at [supabase.com](https://supabase.com)
  2. Create a new project
  3. Go to Settings > Database
  4. Copy connection string

### 3. MongoDB Atlas (MongoDB)
- **Free Tier**: 512MB storage
- **Setup**:
  1. Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
  2. Create a free cluster
  3. Get connection string

### 4. Railway (PostgreSQL)
- **Free Tier**: $5 credit monthly
- **Setup**:
  1. Sign up at [railway.app](https://railway.app)
  2. Create new project
  3. Add PostgreSQL database
  4. Copy connection string

## 🔧 Setup Commands

After configuring your database:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Initialize with default data
node scripts/init-db.js

# Start development server
npm run dev
```

## 🌐 Production Deployment

### Vercel + PlanetScale
```env
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/swasthik-salon?sslaccept=strict"
```

### Vercel + Supabase
```env
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
```

### Vercel + MongoDB Atlas
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/swasthik-salon"
```

## 🔍 Connection String Format

### MySQL
```
mysql://[username]:[password]@[host]:[port]/[database]?[parameters]
```

### PostgreSQL
```
postgresql://[username]:[password]@[host]:[port]/[database]?[parameters]
```

### MongoDB
```
mongodb://[username]:[password]@[host]:[port]/[database]?[parameters]
mongodb+srv://[username]:[password]@[cluster]/[database]?[parameters]
```

## ⚠️ Important Notes

1. **Never commit `.env` files** to version control
2. **Use environment variables** in production
3. **Enable SSL** for production databases
4. **Use strong passwords** for database access
5. **Regularly backup** your data
6. **Monitor usage** to stay within free tier limits

## 🆘 Troubleshooting

### Connection Issues
- Check if database server is running
- Verify connection string format
- Ensure firewall allows connections
- Check username/password credentials

### Prisma Issues
- Run `npx prisma generate` after changing schema
- Run `npx prisma db push` to sync schema
- Check if database driver is installed

### Production Issues
- Verify environment variables are set
- Check database service status
- Review connection limits
- Monitor error logs

Your database is now ready for the Swasthik Salon Customer Management System! 🎉
