# Swasthik Salon Customer Management System

A professional customer management system built for Swasthik Unisex Salon & Academy. This system allows receptionists to manage customer records and provides full CRUD operations for administrators.

## Features

- **User Authentication**: Two-role system (Receptionist & Super Admin)
- **Customer Management**: Store customer details, services, payments, and photos
- **Service Tracking**: Track which staff member provided services
- **Photo Upload**: Upload and store customer photos
- **Import/Export**: CSV and Excel import/export functionality
- **Bulk Operations**: Select and delete multiple customers at once
- **Professional UI**: Clean, modern interface with Swasthik branding
- **Free Deployment**: Ready for deployment on Vercel with free database

## Customer Data Fields

- Customer Name
- Contact Number
- Email (Optional)
- Photo (Optional)
- Services (Multiple services per customer)
- Service Taken By (Optional - Staff member name)
- Amount
- Discount (Percentage only)
- Payment Type (Cash/UPI/Card)
- Visit Date
- Notes (Optional)

## User Roles

### Receptionist
- Create new customer records
- View existing customer records
- Upload customer photos

### Super Admin
- Full CRUD operations on customer records
- Import/Export data
- Manage all customer information

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd swasthik-salon-customer-management
```

2. Install dependencies
```bash
npm install
```

3. Set up the database
```bash
npx prisma generate
npx prisma db push
```

4. Create uploads directory
```bash
mkdir -p public/uploads
```

5. Start the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Login Credentials

**For Development:**
- Default credentials are set in environment variables
- Create `.env.local` file with your credentials (see Environment Variables section)

**For Production:**
- Set secure credentials in Vercel environment variables
- Never commit actual credentials to Git repository

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables

**For Development (.env.local):**
```env
# Admin Credentials (REQUIRED - Set your own secure passwords)
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@domain.com
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_admin_password_here

# Receptionist Credentials (REQUIRED - Set your own secure passwords)
NEXT_PUBLIC_RECEPTION_EMAIL=your_reception_email@domain.com
NEXT_PUBLIC_RECEPTION_PASSWORD=your_secure_reception_password_here

# Database (Optional)
DATABASE_URL="your-database-url"
```

**For Production (Vercel):**
- Set the same variables in Vercel dashboard
- Use strong, unique passwords
- Never use default credentials in production

### Free Database Options

- **PlanetScale**: Free MySQL database
- **Supabase**: Free PostgreSQL database
- **Railway**: Free PostgreSQL database

## File Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin panel
│   ├── dashboard/         # Receptionist dashboard
│   └── login/             # Login page
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/               # Database schema
└── public/               # Static files
```

## API Endpoints

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer by ID
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer
- `POST /api/upload` - Upload photo

## Import/Export

### Export
- Export customer data as CSV or Excel
- Includes all customer fields and service details

### Import
- Import from CSV or Excel files
- Supports bulk customer data import
- Validates data before importing

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma** - Database ORM
- **React Dropzone** - File uploads
- **XLSX** - Excel file handling
- **React Hot Toast** - Notifications
- **Date-fns** - Date formatting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for Swasthik Unisex Salon & Academy.

## Support

For support or questions, please contact the development team.
