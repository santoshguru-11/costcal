#!/bin/bash

# Remote Installation Script for Amazon Linux 2023
# This script will SSH into your server and run the installation

set -e

# Server details
SERVER="santosh@3.85.61.51"
APP_DIR="/home/santosh/cloud-cost-optimizer"

echo "🚀 Starting remote installation on Amazon Linux 2023..."
echo "Server: $SERVER"
echo ""

# Function to run commands on remote server
run_remote() {
    echo "📡 Running: $1"
    ssh $SERVER "$1"
    echo ""
}

# Step 1: Update system and install prerequisites
echo "📦 Step 1: Installing prerequisites..."
run_remote "sudo dnf update -y"
run_remote "sudo dnf install -y git curl wget unzip"

# Step 2: Install Node.js
echo "📦 Step 2: Installing Node.js..."
run_remote "curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -"
run_remote "sudo dnf install -y nodejs"

# Step 3: Install PostgreSQL
echo "📦 Step 3: Installing PostgreSQL..."
run_remote "sudo dnf install -y postgresql15-server postgresql15 postgresql15-contrib"
run_remote "sudo /usr/pgsql-15/bin/postgresql-15-setup initdb || sudo postgresql-setup --initdb || sudo -u postgres /usr/pgsql-15/bin/initdb -D /var/lib/pgsql/15/data"
run_remote "sudo systemctl start postgresql-15"
run_remote "sudo systemctl enable postgresql-15"

# Step 4: Clone repository
echo "📦 Step 4: Cloning repository..."
run_remote "git clone https://github.com/santoshguru-11/costcal.git $APP_DIR"
run_remote "cd $APP_DIR && npm install"

# Step 5: Setup database
echo "📦 Step 5: Setting up database..."
run_remote "sudo -u postgres psql -c \"CREATE DATABASE cloud_cost_optimizer;\""
run_remote "sudo -u postgres psql -c \"CREATE USER cloud_cost_user WITH PASSWORD 'secure_password_123';\""
run_remote "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE cloud_cost_optimizer TO cloud_cost_user;\""
run_remote "sudo -u postgres psql -c \"ALTER USER cloud_cost_user CREATEDB;\"" 

# Step 6: Environment setup
echo "📦 Step 6: Setting up environment..."
run_remote "cd $APP_DIR && cat > .env << 'EOF'
DATABASE_URL=\"postgresql://cloud_cost_user:secure_password_123@localhost:5432/cloud_cost_optimizer\"
SESSION_SECRET=\"\$(openssl rand -base64 32)\"
PORT=3000
NODE_ENV=production
EOF"

# Step 7: Build and start application
echo "📦 Step 7: Building and starting application..."
run_remote "cd $APP_DIR && npm run db:push"
run_remote "cd $APP_DIR && npm run build"

# Step 8: Create systemd service
echo "📦 Step 8: Creating systemd service..."
run_remote "sudo tee /etc/systemd/system/cloud-cost-optimizer.service > /dev/null << 'EOF'
[Unit]
Description=Cloud Cost Optimizer
After=network.target postgresql-15.service

[Service]
Type=simple
User=santosh
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF"

# Step 9: Start service
echo "📦 Step 9: Starting service..."
run_remote "sudo systemctl daemon-reload"
run_remote "sudo systemctl enable cloud-cost-optimizer"
run_remote "sudo systemctl start cloud-cost-optimizer"

# Step 10: Configure firewall
echo "📦 Step 10: Configuring firewall..."
run_remote "sudo firewall-cmd --permanent --add-port=3000/tcp"
run_remote "sudo firewall-cmd --reload"

# Step 11: Verify installation
echo "📦 Step 11: Verifying installation..."
run_remote "sudo systemctl status cloud-cost-optimizer --no-pager"
run_remote "curl -I http://localhost:3000"

echo ""
echo "🎉 Installation completed!"
echo "🌐 Your application is available at: http://3.85.61.51:3000"
echo ""
echo "📋 Management commands:"
echo "• Check status: ssh $SERVER 'sudo systemctl status cloud-cost-optimizer'"
echo "• View logs: ssh $SERVER 'sudo journalctl -u cloud-cost-optimizer -f'"
echo "• Restart: ssh $SERVER 'sudo systemctl restart cloud-cost-optimizer'"
