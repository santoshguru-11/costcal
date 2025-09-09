# Cloud Cost Optimizer - Server Setup Guide

This guide will help you deploy and run the Cloud Cost Optimizer application on a server after cloning from git.

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/santoshguru-11/inventory_cost.git
cd inventory_cost
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env
nano .env
```

Configure your `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/cloud_cost_optimizer"
SESSION_SECRET="your-session-secret-key-here"
PORT=3000
NODE_ENV=production
```

### 4. Set Up Database
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE cloud_cost_optimizer;
CREATE USER cloud_cost_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cloud_cost_optimizer TO cloud_cost_user;
\q
```

### 5. Run Database Setup
```bash
# Run the database setup script
psql -U cloud_cost_user -d cloud_cost_optimizer -f database_setup.sql
```

### 6. Install Python Dependencies (for OCI integration)
```bash
# Install Python 3 and pip
sudo apt install python3 python3-pip

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install OCI SDK
pip install oci
```

### 7. Build and Start the Application
```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🐧 Amazon Linux 2023 Setup

### Prerequisites Installation
```bash
# Update system
sudo dnf update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install nodejs -y

# Install PostgreSQL
sudo dnf install postgresql15 postgresql15-server -y

# Initialize and start PostgreSQL
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15

# Install Python 3 and pip
sudo dnf install python3 python3-pip -y
```

### Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE cloud_cost_optimizer;
CREATE USER cloud_cost_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cloud_cost_optimizer TO cloud_cost_user;
\q

# Run database setup
psql -U cloud_cost_user -d cloud_cost_optimizer -f database_setup.sql
```

### Application Setup
```bash
# Clone and setup
git clone https://github.com/santoshguru-11/inventory_cost.git
cd inventory_cost
npm install

# Create virtual environment for Python
python3 -m venv .venv
source .venv/bin/activate
pip install oci

# Configure environment
cp .env.example .env
nano .env
```

### Production Deployment
```bash
# Build application
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name "cloud-cost-optimizer"
pm2 save
pm2 startup
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://cloud_cost_user:your_password@localhost:5432/cloud_cost_optimizer"

# Session Configuration
SESSION_SECRET="your-super-secret-session-key-here"

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Encryption Key (auto-generated if not provided)
ENCRYPTION_KEY="your-32-character-encryption-key"
```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Clone repository
git clone https://github.com/santoshguru-11/inventory_cost.git
cd inventory_cost

# Create .env file
cp .env.example .env
nano .env

# Start with Docker Compose
docker-compose up -d
```

### Manual Docker Build
```bash
# Build Docker image
docker build -t cloud-cost-optimizer .

# Run with PostgreSQL
docker run -d --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=cloud_cost_optimizer -p 5432:5432 postgres:15

# Run application
docker run -d --name cloud-cost-optimizer --link postgres -p 3000:3000 cloud-cost-optimizer
```

## 🔒 Security Configuration

### Firewall Setup
```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 22
sudo ufw enable

# Amazon Linux
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo service iptables save
```

### SSL/HTTPS Setup (with Nginx)
```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cloud-cost-optimizer
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring and Logs

### PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs cloud-cost-optimizer

# Restart application
pm2 restart cloud-cost-optimizer

# Monitor resources
pm2 monit
```

### System Service (systemd)
Create a systemd service file:
```bash
sudo nano /etc/systemd/system/cloud-cost-optimizer.service
```

Service file content:
```ini
[Unit]
Description=Cloud Cost Optimizer
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/inventory_cost
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloud-cost-optimizer
sudo systemctl start cloud-cost-optimizer
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check database exists
   psql -U cloud_cost_user -d cloud_cost_optimizer -c "\dt"
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port 3000
   sudo lsof -i :3000
   
   # Kill process
   sudo kill -9 <PID>
   ```

3. **Python OCI SDK Issues**
   ```bash
   # Activate virtual environment
   source .venv/bin/activate
   
   # Reinstall OCI SDK
   pip uninstall oci
   pip install oci
   ```

4. **Build Errors**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Health Check
```bash
# Check if application is running
curl http://localhost:3000/api/health

# Expected response: {"status":"ok","timestamp":"..."}
```

## 📈 Performance Optimization

### Production Optimizations
1. **Enable Gzip compression**
2. **Set up Redis for session storage**
3. **Configure database connection pooling**
4. **Use CDN for static assets**
5. **Implement rate limiting**

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_cloud_credentials_user_id ON cloud_credentials(user_id);
CREATE INDEX idx_inventory_scans_user_id ON inventory_scans(user_id);
CREATE INDEX idx_cost_analyses_user_id ON cost_analyses(user_id);
```

## 🚀 Deployment Checklist

- [ ] Server prepared (Node.js 18+, PostgreSQL 14+, Python 3)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Database created and schema applied
- [ ] Python virtual environment set up
- [ ] Application built (`npm run build`)
- [ ] Firewall configured
- [ ] SSL certificate installed (optional)
- [ ] Monitoring set up (PM2/systemd)
- [ ] Health check passing

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs` or `journalctl -u cloud-cost-optimizer`
2. Verify environment variables
3. Ensure all services are running
4. Check firewall and port accessibility

For additional help, create an issue in the GitHub repository.
