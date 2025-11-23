# RPMS - Research Paper Management System

A comprehensive full-stack application for managing research papers, reviews, and academic events. Built with Next.js, Go, and Supabase PostgreSQL.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Go 1.22+ with Gin framework
- **Database**: Supabase PostgreSQL
- **Authentication**: JWT tokens with role-based access control

## 🚀 Features

### User Roles
- **Authors**: Submit and manage research papers
- **Editors**: Review papers and provide feedback
- **Admins**: Approve papers and manage users
- **Coordinators**: Create and manage academic events

### Core Functionality
- Paper submission and management
- Peer review system with ratings and recommendations
- Event management and coordination
- Role-based access control
- Real-time notifications
- Responsive design

## 📋 Prerequisites

- Node.js 18+ 
- Go 1.22+
- PostgreSQL (via Supabase)
- Git

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd RPMS
```

### 2. Setup Frontend
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Configure Supabase variables in .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Setup Backend
```bash
cd backend

# Install Go dependencies
go mod download

# Create environment file
cp .env.example .env

# Configure database and JWT variables
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=rpms_db
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
```

### 4. Setup Supabase Database
1. Create a new Supabase project
2. Run the SQL migrations from `backend/internal/database/database.go`
3. Configure authentication settings
4. Update environment variables with your Supabase credentials

## 🏃‍♂️ Running the Application

### Start the Backend
```bash
cd backend
go run main.go
```
The API server will start on `http://localhost:8080`

### Start the Frontend
```bash
# In a new terminal
npm run dev
```
The Next.js app will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/profile` - Get user profile

### Paper Endpoints
- `GET /api/v1/papers` - Get all papers
- `POST /api/v1/papers` - Create paper (Author/Admin)
- `PUT /api/v1/papers/:id` - Update paper (Author/Admin)
- `DELETE /api/v1/papers/:id` - Delete paper (Author/Admin)

### Review Endpoints
- `GET /api/v1/reviews` - Get all reviews
- `POST /api/v1/reviews` - Create review (Editor/Admin)

### Event Endpoints
- `GET /api/v1/events` - Get all events
- `POST /api/v1/events` - Create event (Coordinator/Admin)
- `PUT /api/v1/events/:id` - Update event (Coordinator/Admin)
- `DELETE /api/v1/events/:id` - Delete event (Coordinator/Admin)

## 🔐 Authentication & Authorization

The system uses JWT tokens for authentication with role-based access control:

- **Author**: Can create and edit their own papers
- **Editor**: Can review papers and submit feedback
- **Admin**: Full system access and paper approval
- **Coordinator**: Can manage events

## 🗄️ Database Schema

### Users Table
- `id`: UUID (Primary Key)
- `email`: VARCHAR(255) (Unique)
- `password_hash`: VARCHAR(255)
- `name`: VARCHAR(255)
- `role`: ENUM('author', 'editor', 'admin', 'coordinator')

### Papers Table
- `id`: UUID (Primary Key)
- `title`: VARCHAR(500)
- `abstract`: TEXT
- `content`: TEXT
- `author_id`: UUID (Foreign Key)
- `status`: ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'published')

### Reviews Table
- `id`: UUID (Primary Key)
- `paper_id`: UUID (Foreign Key)
- `reviewer_id`: UUID (Foreign Key)
- `rating`: INTEGER (1-5)
- `comments`: TEXT
- `recommendation`: ENUM('accept', 'minor_revision', 'major_revision', 'reject')

### Events Table
- `id`: UUID (Primary Key)
- `title`: VARCHAR(500)
- `description`: TEXT
- `date`: DATE
- `location`: VARCHAR(255)
- `coordinator_id`: UUID (Foreign Key)

## 🧪 Testing

### Frontend Tests
```bash
npm run test
```

### Backend Tests
```bash
cd backend
go test ./...
```

## 📦 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Backend (Docker)
```bash
# Build Docker image
docker build -t rpms-backend .

# Run container
docker run -p 8080:8080 rpms-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact the development team or open an issue on GitHub.

## 🔄 Migration from Vite + Firebase

This project has been migrated from:
- **React + Vite** → **Next.js 15**
- **Firebase** → **Supabase PostgreSQL**
- **No backend** → **Go 1.22+ REST API**

Key improvements:
- Better SEO and performance with Next.js
- More robust database with PostgreSQL
- Type-safe backend with Go
- Enhanced security with JWT authentication
