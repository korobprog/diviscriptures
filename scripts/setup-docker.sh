#!/bin/bash

# Vrinda Sangha - Docker Setup Script
echo "🚀 Setting up Vrinda Sangha with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Database Configuration (Docker PostgreSQL)
DATABASE_URL="postgresql://vrinda_user:vrinda_password@localhost:5432/vrinda_sangha?schema=public"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Development Settings
NODE_ENV="development"
EOF
    echo "✅ .env.local created with generated NEXTAUTH_SECRET"
else
    echo "✅ .env.local already exists"
fi

# Start PostgreSQL container
echo "🐘 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec postgres pg_isready -U vrinda_user -d vrinda_sangha; do
    echo "⏳ Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm db:generate

# Push database schema
echo "📊 Pushing database schema..."
pnpm db:push

# Seed database with test data
echo "🌱 Seeding database with test data..."
pnpm db:seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 What's available:"
echo "  • PostgreSQL: localhost:5432"
echo "  • Database: vrinda_sangha"
echo "  • User: vrinda_user"
echo "  • Password: vrinda_password"
echo ""
echo "🔧 Useful commands:"
echo "  • Start containers: docker-compose up -d"
echo "  • Stop containers: docker-compose down"
echo "  • View logs: docker-compose logs postgres"
echo "  • Access database: docker-compose exec postgres psql -U vrinda_user -d vrinda_sangha"
echo ""
echo "🚀 Next steps:"
echo "  1. Run: pnpm dev"
echo "  2. Open: http://localhost:3000"
echo "  3. Test the application!"
