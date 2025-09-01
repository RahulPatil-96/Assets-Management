# College Asset Management System

A comprehensive web-based Asset Management System for colleges to track and manage IT/lab equipment with role-based access control, automated workflows, and real-time notifications.

## Features

### User Roles & Permissions
- **HOD (Head of Department)**: Approve assets and transfers, view system alerts, manage approvals, oversee all labs
- **Lab Incharge**: Approve assets within their lab, manage lab-specific operations, oversee lab assistants
- **Lab Assistant**: Full CRUD operations on assets, resolve issues, manage transfers, initiate asset requests
- **Faculty**: Report issues, read-only access to asset information

### Core Functionality
- **Asset Management**: Complete lifecycle management with approval workflows, automatic asset ID generation, and comprehensive tracking
- **Issue Tracking**: Report and resolve asset problems with escalation, cost estimation, and resolution tracking
- **Asset Transfers**: Lab-to-lab transfers with multi-level approval (Lab Incharge → HOD) and confirmation tracking
- **Lab Management**: Create and manage multiple labs with unique identifiers and location tracking
- **Analytics & Reporting**: Dashboard with asset analytics, issue analytics, and comprehensive charts using Chart.js
- **Export Capabilities**: Export data to Excel, PDF, and other formats for reporting
- **Real-time Notifications**: Automated alerts for delayed resolutions, approvals, and system events
- **Activity Logging**: Comprehensive audit trail for all system activities with severity levels
- **Settings & Preferences**: User profile management and notification preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices with dark mode support

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Supabase (Database, Auth, Real-time)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Query (@tanstack/react-query)
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Export**: ExcelJS, jsPDF with autoTable
- **Development**: Storybook, ESLint, Prettier

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
   - Copy and run the SQL from `Supabase/schema.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Create your first user**
   - Visit the application
   - Sign up with your email
   - Choose your role (HOD, Lab Incharge, Lab Assistant, or Faculty)
   - Provide your lab ID

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build Storybook for deployment

## Database Schema

### Tables
- `user_profiles`: User metadata with roles (HOD, Lab Incharge, Lab Assistant, Faculty) and lab assignments
- `labs`: Lab information with unique identifiers and location tracking
- `assets`: Main asset inventory with approval workflow, automatic asset ID generation, and comprehensive tracking
- `asset_issues`: Issue tracking and resolution with cost estimation and status management
- `asset_transfers`: Lab-to-lab asset transfers with multi-level approval process
- `notifications`: Real-time notifications for system events and user actions
- `activity_logs`: Comprehensive audit trail with severity levels and metadata

### Key Features
- **Automatic Asset ID Generation**: Assets get unique IDs based on lab identifier and asset type
- **Multi-level Approval Workflow**: Assets require Lab Incharge and HOD approval
- **Real-time Notifications**: Automated notifications for all system activities
- **Activity Logging**: Full audit trail with JSON diff tracking for changes
- **Row-Level Security (RLS)**: Enabled on all tables with role-based policies
- **Automatic Timestamps**: Created/updated timestamps on all tables
- **Foreign Key Constraints**: Proper referential integrity across all tables

## User Guide

### For HODs
- Review and approve pending assets and transfers
- Monitor system alerts for delayed issues and approvals
- View comprehensive reports and analytics across all labs
- Oversee all lab activities and user management
- Access system-wide settings and configurations

### For Lab Incharges
- Approve assets within their assigned lab
- Review and manage lab-specific operations
- Oversee lab assistants and their activities
- Monitor lab inventory and issue resolution
- Initiate inter-lab transfers when needed

### For Lab Assistants
- Add and manage assets in their assigned lab
- Resolve reported issues promptly with cost estimation
- Initiate and track asset transfers between labs
- Maintain accurate inventory records
- Generate reports for lab-specific data

### For Faculty
- Report asset issues and malfunctions
- View asset information for reference
- Track status of reported issues
- Access read-only system data
- Receive notifications about issue resolutions

## Application Architecture

### Frontend Architecture
- **Component Structure**: Modular component architecture with lazy loading for performance
- **State Management**: React Query for server state, React Context for global state
- **Routing**: React Router with protected routes and role-based access
- **Error Handling**: Error boundaries and comprehensive error handling throughout
- **Performance**: Code splitting, lazy loading, and optimized re-renders

### Backend Architecture
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth with role-based access control
- **Real-time**: Supabase real-time subscriptions for live updates
- **Security**: Row-level security, input validation, and secure API endpoints

### Key Components
- **Dashboard**: Overview with analytics and quick actions
- **Asset Management**: CRUD operations with approval workflows
- **Issue Tracking**: Full lifecycle management with escalation
- **Transfer System**: Multi-step approval process for asset movement
- **Notification System**: Real-time alerts and activity feeds
- **Analytics**: Charts and reports for data visualization
- **Export System**: Multiple format support for data export

## Enhancement Plan

A comprehensive enhancement plan has been created to improve the system. Key areas of focus include:

### Planned Improvements
- **Code Quality**: Stronger TypeScript typing, reusable components, better error handling
- **Performance**: Optimized real-time subscriptions, pagination, memoization
- **UX/UI**: Enhanced accessibility, loading states, bulk operations
- **Features**: Advanced search, additional export formats, audit logging
- **Testing**: Unit tests, integration tests, CI/CD pipeline
- **Documentation**: API docs, component stories, architecture diagrams

See [TODO.md](./TODO.md) for the complete enhancement roadmap and implementation details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add JSDoc comments for complex functions
- Test changes thoroughly before submitting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

### Getting Help
- Check the [TODO.md](./TODO.md) for planned features
- Review existing issues before creating new ones
- Provide detailed information when reporting bugs
- Include steps to reproduce issues
