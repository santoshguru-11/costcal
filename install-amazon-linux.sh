#!/bin/bash

# Cloud Cost Optimizer - Amazon Linux 2023 Installation Script
# This script installs all dependencies and sets up the application on Amazon Linux 2023

set -e  # Exit on any error

echo "🚀 Starting Cloud Cost Optimizer installation on Amazon Linux 2023..."

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo dnf update -y

# Install Node.js 18+ using NodeSource repository
print_status "Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js installed: $NODE_VERSION"
print_success "npm installed: $NPM_VERSION"

# Install PostgreSQL 14+
print_status "Installing PostgreSQL..."
sudo dnf install -y postgresql15-server postgresql15 postgresql15-contrib

# Initialize and start PostgreSQL
print_status "Initializing PostgreSQL database..."
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15

# Install OCI CLI for Oracle Cloud integration
print_status "Installing OCI CLI..."
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)" -- --accept-all-defaults

# Install additional system dependencies
print_status "Installing additional system dependencies..."
sudo dnf install -y git curl wget unzip python3 python3-pip

# Install Python dependencies for OCI CLI
print_status "Installing Python dependencies..."
pip3 install --user oci-cli

# Install PM2 for process management (optional but recommended)
print_status "Installing PM2 for process management..."
sudo npm install -g pm2

# Create application directory
APP_DIR="/opt/cloud-cost-optimizer"
print_status "Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone the repository (if not already present)
if [ ! -d "$APP_DIR/.git" ]; then
    print_status "Cloning repository..."
    git clone https://github.com/santoshguru-11/inventory_cost.git $APP_DIR
else
    print_status "Repository already exists, updating..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Set up PostgreSQL database
print_status "Setting up PostgreSQL database..."

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE cloud_cost_optimizer;
CREATE USER cloud_cost_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE cloud_cost_optimizer TO cloud_cost_user;
ALTER USER cloud_cost_user CREATEDB;
\q
EOF

# Create environment file
print_status "Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://cloud_cost_user:secure_password_123@localhost:5432/cloud_cost_optimizer"

# Session Configuration
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Add your cloud provider credentials here
# AWS_ACCESS_KEY_ID=""
# AWS_SECRET_ACCESS_KEY=""
# AWS_REGION="us-east-1"

# AZURE_CLIENT_ID=""
# AZURE_CLIENT_SECRET=""
# AZURE_TENANT_ID=""

# GCP_PROJECT_ID=""
# GCP_PRIVATE_KEY=""
# GCP_CLIENT_EMAIL=""

# OCI_USER_OCID=""
# OCI_TENANCY_OCID=""
# OCI_FINGERPRINT=""
# OCI_PRIVATE_KEY_PATH=""
# OCI_REGION="us-ashburn-1"
EOF

# Run database migrations
print_status "Setting up database schema..."
npm run db:push

# Build the application
print_status "Building the application..."
npm run build

# Create systemd service file
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/cloud-cost-optimizer.service > /dev/null << EOF
[Unit]
Description=Cloud Cost Optimizer
After=network.target postgresql-15.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
print_status "Enabling and starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable cloud-cost-optimizer
sudo systemctl start cloud-cost-optimizer

# Configure firewall (if firewalld is running)
if systemctl is-active --quiet firewalld; then
    print_status "Configuring firewall..."
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --reload
fi

# Check service status
print_status "Checking service status..."
sleep 5
if systemctl is-active --quiet cloud-cost-optimizer; then
    print_success "Service is running successfully!"
else
    print_error "Service failed to start. Check logs with: sudo journalctl -u cloud-cost-optimizer -f"
fi

# Display installation summary
echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Installation Summary:"
echo "========================"
echo "• Application Directory: $APP_DIR"
echo "• Database: PostgreSQL 15 (cloud_cost_optimizer)"
echo "• Database User: cloud_cost_user"
echo "• Service: cloud-cost-optimizer.service"
echo "• Port: 3000"
echo "• Node.js: $NODE_VERSION"
echo "• npm: $NPM_VERSION"
echo ""
echo "🌐 Access your application:"
echo "• Local: http://localhost:3000"
echo "• External: http://$(curl -s ifconfig.me):3000"
echo ""
echo "🔧 Management Commands:"
echo "• Check status: sudo systemctl status cloud-cost-optimizer"
echo "• View logs: sudo journalctl -u cloud-cost-optimizer -f"
echo "• Restart: sudo systemctl restart cloud-cost-optimizer"
echo "• Stop: sudo systemctl stop cloud-cost-optimizer"
echo ""
echo "📝 Next Steps:"
echo "1. Update the .env file with your actual cloud credentials"
echo "2. Configure OCI CLI: oci setup config"
echo "3. Test the application by visiting the URL above"
echo "4. Set up SSL/TLS certificates for production use"
echo ""
echo "⚠️  Security Notes:"
echo "• Change the default database password"
echo "• Update the SESSION_SECRET in .env"
echo "• Configure proper firewall rules"
echo "• Set up SSL certificates for HTTPS"
echo ""
print_success "Installation completed! Your Cloud Cost Optimizer is ready to use."
