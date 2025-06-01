#!/bin/bash

# Enhanced Knowledge Base Setup Script
echo "🚀 Setting up Enhanced Knowledge Base System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Create environment files if they don't exist
print_status "Setting up environment files..."

# Frontend environment
if [ ! -f ".env" ]; then
    print_status "Creating frontend .env file..."
    cat > .env << EOF
# Frontend Environment Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001/api

# Development Settings
VITE_NODE_ENV=development
VITE_DEBUG=true
EOF
    print_warning "Please update .env with your actual Supabase credentials"
else
    print_success "Frontend .env file already exists"
fi

# Backend environment
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend .env file..."
    cat > backend/.env << EOF
# Backend Environment Configuration

# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# File Storage
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads

# Security
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:5173
EOF
    print_warning "Please update backend/.env with your actual credentials"
else
    print_success "Backend .env file already exists"
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
if npm install; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p backend/uploads
mkdir -p backend/logs
print_success "Directories created"

# Check if ports are available
print_status "Checking port availability..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Port 3001 is already in use (backend)"
else
    print_success "Port 3001 is available (backend)"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Port 5173 is already in use (frontend)"
else
    print_success "Port 5173 is available (frontend)"
fi

# Display next steps
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update environment files with your credentials:"
echo "   - Frontend: .env"
echo "   - Backend: backend/.env"
echo ""
echo "2. Set up your Supabase database:"
echo "   - Run the SQL schema: supabase_enhanced_schema.sql"
echo "   - Configure storage buckets"
echo ""
echo "3. Start the development servers:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: npm run dev"
echo ""
echo "4. Access your application:"
echo "   🌐 Frontend: http://localhost:5173"
echo "   🔧 Backend:  http://localhost:3001"
echo ""
echo "📚 Documentation:"
echo "   - Implementation Guide: NEXT_STEPS_GUIDE.md"
echo "   - Setup Guide: SETUP_GUIDE.md"
echo ""
echo "🚀 Your Enhanced Knowledge Base is ready to launch!" 