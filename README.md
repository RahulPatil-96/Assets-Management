# College Asset Management System

A comprehensive web-based Asset Management System for colleges to track and manage IT/lab equipment with role-based access control, automated workflows, and real-time notifications.

## Features

### User Roles & Permissions
- **HOD (Head of Department)**: Approve assets, view system alerts, manage approvals
- **Lab Assistant**: Full CRUD operations on assets, resolve issues, manage transfers
- **Faculty**: Report issues, read-only access to asset information

### Core Functionality
- **Asset Management**: Complete lifecycle management with approval workflows
- **Issue Tracking**: Report and resolve asset problems with escalation
- **Asset Transfers**: Lab-to-lab transfers with confirmation tracking
- **Real-time Notifications**: Automated alerts for delayed resolutions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Supabase (Database, Auth, Real-time)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd asset-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create a `.env` file based on `.env.example`
   - Add your Supabase credentials

4. **Run database migrations**
   - Go to the Supabase SQL editor
   - Copy and run the SQL from `supabase/migrations/create_asset_management_schema.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Create your first user**
   - Visit the application
   - Sign up with your email
   - Choose your role (HOD, Lab Assistant, or Faculty)
   - Provide your lab ID

## Database Schema

### Tables
- `user_profiles`: User metadata with roles and lab assignments
- `assets`: Main asset inventory with approval workflow
- `asset_issues`: Issue tracking and resolution
- `asset_transfers`: Lab-to-lab asset transfers

### Security
- Row-Level Security (RLS) enabled on all tables
- Role-based policies for data access
- Automatic timestamp updates
- Proper foreign key constraints

## User Guide

### For HODs
- Review and approve pending assets
- Monitor system alerts for delayed issues
- View comprehensive reports and analytics
- Oversee all lab activities

### For Lab Assistants
- Add and manage assets in your lab
- Resolve reported issues promptly
- Initiate and confirm asset transfers
- Maintain accurate inventory records

### For Faculty
- Report asset issues and malfunctions
- View asset information for reference
- Track status of reported issues
- Access read-only system data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.