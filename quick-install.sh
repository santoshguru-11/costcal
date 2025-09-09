#!/bin/bash

# Cloud Cost Optimizer - Quick Installation Script
# This script automates the installation process on Ubuntu/Debian servers

set -e

echo "🚀 Cloud Cost Optimizer - Quick Installation Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Install Python 3 and pip
print_status "Installing Python 3 and pip..."
sudo apt install python3 python3-pip python3-venv -y

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Start and enable PostgreSQL
print_status "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Setting up database..."
sudo -u postgres psql << EOF
CREATE DATABASE cloud_cost_optimizer;
CREATE USER cloud_cost_user WITH PASSWORD 'cloud_cost_password_2024';
GRANT ALL PRIVILEGES ON DATABASE cloud_cost_optimizer TO cloud_cost_user;
\q
EOF

# Clone repository if not already present
if [ ! -d "inventory_cost" ]; then
    print_status "Cloning repository..."
    git clone https://github.com/santoshguru-11/inventory_cost.git
fi

cd inventory_cost

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Create Python virtual environment
print_status "Setting up Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install oci

# Create .env file
print_status "Creating environment configuration..."
cat > .env << EOF
DATABASE_URL="postgresql://cloud_cost_user:cloud_cost_password_2024@localhost:5432/cloud_cost_optimizer"
SESSION_SECRET="$(openssl rand -base64 32)"
PORT=3000
NODE_ENV=production
ENCRYPTION_KEY="$(openssl rand -base64 32 | cut -c1-32)"
EOF

# Run database setup
print_status "Setting up database schema..."
PGPASSWORD=cloud_cost_password_2024 psql -U cloud_cost_user -d cloud_cost_optimizer -f database_setup.sql

# Build application
print_status "Building application..."
npm run build

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 3000
sudo ufw allow 22
sudo ufw --force enable

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start dist/index.js --name "cloud-cost-optimizer"
pm2 save
pm2 startup

# Wait for application to start
print_status "Waiting for application to start..."
sleep 10

# Health check
print_status "Performing health check..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "✅ Application is running successfully!"
    echo ""
    echo "🌐 Access your application at: http://$(curl -s ifconfig.me):3000"
    echo "📊 Monitor with: pm2 monit"
    echo "📝 View logs with: pm2 logs cloud-cost-optimizer"
    echo ""
    echo "🔐 Default credentials:"
    echo "   Email: admin@example.com"
    echo "   Password: admin123"
    echo ""
    echo "⚠️  IMPORTANT: Change the default password after first login!"
else
    print_error "❌ Application failed to start. Check logs with: pm2 logs cloud-cost-optimizer"
    exit 1
fi

print_status "🎉 Installation completed successfully!"
