# Cloud Cost Optimizer - Amazon Linux 2023 Installation Guide

This guide provides step-by-step instructions for installing the Cloud Cost Optimizer application on Amazon Linux 2023.

## 🎯 Prerequisites

- Amazon Linux 2023 instance
- Root or sudo access
- Internet connectivity
- At least 2GB RAM and 10GB disk space

## 🚀 Quick Installation (Automated)

### Option 1: One-Command Installation

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/santoshguru-11/inventory_cost/main/install-amazon-linux.sh | bash
```

### Option 2: Manual Script Execution

```bash
# Clone the repository
git clone https://github.com/santoshguru-11/inventory_cost.git
cd inventory_cost

# Make the script executable
chmod +x install-amazon-linux.sh

# Run the installation script
./install-amazon-linux.sh
```

## 📋 Manual Installation Steps

If you prefer to install manually or need to troubleshoot, follow these steps:

### 1. System Update

```bash
sudo dnf update -y
```

### 2. Install Node.js 18+

```bash
# Add NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Install Node.js
sudo dnf install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version
```

### 3. Install PostgreSQL 15

```bash
# Install PostgreSQL
sudo dnf install -y postgresql15-server postgresql15 postgresql15-contrib

# Initialize database
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Start and enable PostgreSQL
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15
```

### 4. Install OCI CLI (for Oracle Cloud)

```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)" -- --accept-all-defaults

# Install Python dependencies
pip3 install --user oci-cli
```

### 5. Install Additional Dependencies

```bash
sudo dnf install -y git curl wget unzip python3 python3-pip
sudo npm install -g pm2  # Optional: for process management
```

### 6. Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/cloud-cost-optimizer
sudo chown $USER:$USER /opt/cloud-cost-optimizer

# Clone repository
git clone https://github.com/santoshguru-11/inventory_cost.git /opt/cloud-cost-optimizer
cd /opt/cloud-cost-optimizer

# Install dependencies
npm install
```

### 7. Database Setup

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE cloud_cost_optimizer;
CREATE USER cloud_cost_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE cloud_cost_optimizer TO cloud_cost_user;
ALTER USER cloud_cost_user CREATEDB;
\q
EOF
```

### 8. Environment Configuration

Create `.env` file:

```bash
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://cloud_cost_user:secure_password_123@localhost:5432/cloud_cost_optimizer"

# Session Configuration
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Server Configuration
PORT=3000
NODE_ENV=production

# Cloud Provider Credentials (Optional - add your actual credentials)
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
```

### 9. Database Migration and Build

```bash
# Run database migrations
npm run db:push

# Build the application
npm run build
```

### 10. Create Systemd Service

```bash
sudo tee /etc/systemd/system/cloud-cost-optimizer.service > /dev/null << EOF
[Unit]
Description=Cloud Cost Optimizer
After=network.target postgresql-15.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/cloud-cost-optimizer
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### 11. Start the Service

```bash
# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable cloud-cost-optimizer
sudo systemctl start cloud-cost-optimizer

# Check status
sudo systemctl status cloud-cost-optimizer
```

### 12. Configure Firewall

```bash
# If firewalld is running
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Or if using iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo service iptables save
```

## 🔧 Configuration

### Cloud Provider Setup

#### AWS Configuration
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
```

#### Azure Configuration
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login
```

#### Google Cloud Configuration
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize gcloud
gcloud init
```

#### Oracle Cloud Configuration
```bash
# Configure OCI CLI
oci setup config
```

## 🌐 Accessing the Application

After successful installation:

- **Local Access**: http://localhost:3000
- **External Access**: http://YOUR_SERVER_IP:3000

## 🔍 Troubleshooting

### Check Service Status
```bash
sudo systemctl status cloud-cost-optimizer
```

### View Logs
```bash
# View recent logs
sudo journalctl -u cloud-cost-optimizer -n 50

# Follow logs in real-time
sudo journalctl -u cloud-cost-optimizer -f
```

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep :3000

# Kill the process if needed
sudo kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql-15

# Test database connection
psql -h localhost -U cloud_cost_user -d cloud_cost_optimizer
```

#### 3. Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/cloud-cost-optimizer

# Fix permissions
chmod -R 755 /opt/cloud-cost-optimizer
```

#### 4. Node.js Version Issues
```bash
# Check Node.js version
node --version

# If version is too old, reinstall
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
```

## 🔒 Security Considerations

### 1. Change Default Passwords
```bash
# Change database password
sudo -u postgres psql -c "ALTER USER cloud_cost_user PASSWORD 'your_secure_password';"
```

### 2. Update Environment Variables
```bash
# Generate a secure session secret
openssl rand -base64 32

# Update .env file with the generated secret
```

### 3. Configure SSL/TLS
```bash
# Install certbot for Let's Encrypt
sudo dnf install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com
```

### 4. Firewall Configuration
```bash
# Allow only necessary ports
sudo firewall-cmd --permanent --add-port=22/tcp    # SSH
sudo firewall-cmd --permanent --add-port=3000/tcp  # Application
sudo firewall-cmd --permanent --add-port=80/tcp    # HTTP
sudo firewall-cmd --permanent --add-port=443/tcp   # HTTPS
sudo firewall-cmd --reload
```

## 📊 Monitoring and Maintenance

### 1. Service Management
```bash
# Start service
sudo systemctl start cloud-cost-optimizer

# Stop service
sudo systemctl stop cloud-cost-optimizer

# Restart service
sudo systemctl restart cloud-cost-optimizer

# Check status
sudo systemctl status cloud-cost-optimizer
```

### 2. Log Rotation
```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/cloud-cost-optimizer > /dev/null << EOF
/var/log/cloud-cost-optimizer/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        sudo systemctl reload cloud-cost-optimizer
    endscript
}
EOF
```

### 3. Backup Database
```bash
# Create backup script
cat > /opt/backup-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -h localhost -U cloud_cost_user cloud_cost_optimizer > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/backup-db.sh

# Add to crontab for daily backups
echo "0 2 * * * /opt/backup-db.sh" | crontab -
```

## 🚀 Performance Optimization

### 1. Enable PM2 (Alternative to systemd)
```bash
# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "cloud-cost-optimizer"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 2. Database Optimization
```bash
# Edit PostgreSQL configuration
sudo nano /var/lib/pgsql/15/data/postgresql.conf

# Recommended settings:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# maintenance_work_mem = 64MB
# checkpoint_completion_target = 0.9
# wal_buffers = 16MB
# default_statistics_target = 100

# Restart PostgreSQL
sudo systemctl restart postgresql-15
```

## 📞 Support

If you encounter any issues:

1. Check the logs: `sudo journalctl -u cloud-cost-optimizer -f`
2. Verify all services are running: `sudo systemctl status cloud-cost-optimizer postgresql-15`
3. Check network connectivity: `curl -I http://localhost:3000`
4. Review the troubleshooting section above
5. Create an issue on GitHub: https://github.com/santoshguru-11/inventory_cost/issues

## 🎉 Success!

Your Cloud Cost Optimizer is now installed and running on Amazon Linux 2023! 

Access your application at: http://YOUR_SERVER_IP:3000

Happy cost optimizing! 🚀
