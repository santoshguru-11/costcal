#!/bin/bash

# Environment Setup Script for Cloud Cost Optimizer
# This script helps configure environment variables and cloud credentials

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "🔧 Cloud Cost Optimizer - Environment Setup"
echo "============================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env 2>/dev/null || {
        print_status "Creating new .env file..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://cloud_cost_user:secure_password_123@localhost:5432/cloud_cost_optimizer"

# Session Configuration
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Server Configuration
PORT=3000
NODE_ENV=production

# Cloud Provider Credentials (Optional)
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
    }
fi

print_status "Environment setup wizard starting..."
echo ""

# Generate secure session secret
print_status "Generating secure session secret..."
SESSION_SECRET=$(openssl rand -base64 32)
sed -i "s/your-super-secret-session-key-change-this-in-production/$SESSION_SECRET/" .env
print_success "Session secret generated and updated"

echo ""
print_status "Cloud Provider Configuration"
echo "================================"
echo "You can configure cloud provider credentials now or later through the web interface."
echo ""

# AWS Configuration
read -p "Do you want to configure AWS credentials? (y/n): " configure_aws
if [[ $configure_aws =~ ^[Yy]$ ]]; then
    read -p "Enter AWS Access Key ID: " aws_access_key
    read -p "Enter AWS Secret Access Key: " aws_secret_key
    read -p "Enter AWS Region (default: us-east-1): " aws_region
    aws_region=${aws_region:-us-east-1}
    
    sed -i "s/# AWS_ACCESS_KEY_ID=\"\"/AWS_ACCESS_KEY_ID=\"$aws_access_key\"/" .env
    sed -i "s/# AWS_SECRET_ACCESS_KEY=\"\"/AWS_SECRET_ACCESS_KEY=\"$aws_secret_key\"/" .env
    sed -i "s/# AWS_REGION=\"us-east-1\"/AWS_REGION=\"$aws_region\"/" .env
    
    print_success "AWS credentials configured"
fi

# Azure Configuration
read -p "Do you want to configure Azure credentials? (y/n): " configure_azure
if [[ $configure_azure =~ ^[Yy]$ ]]; then
    read -p "Enter Azure Client ID: " azure_client_id
    read -p "Enter Azure Client Secret: " azure_client_secret
    read -p "Enter Azure Tenant ID: " azure_tenant_id
    
    sed -i "s/# AZURE_CLIENT_ID=\"\"/AZURE_CLIENT_ID=\"$azure_client_id\"/" .env
    sed -i "s/# AZURE_CLIENT_SECRET=\"\"/AZURE_CLIENT_SECRET=\"$azure_client_secret\"/" .env
    sed -i "s/# AZURE_TENANT_ID=\"\"/AZURE_TENANT_ID=\"$azure_tenant_id\"/" .env
    
    print_success "Azure credentials configured"
fi

# GCP Configuration
read -p "Do you want to configure Google Cloud credentials? (y/n): " configure_gcp
if [[ $configure_gcp =~ ^[Yy]$ ]]; then
    read -p "Enter GCP Project ID: " gcp_project_id
    read -p "Enter GCP Client Email: " gcp_client_email
    echo "Enter GCP Private Key (paste the entire JSON key):"
    read -p "> " gcp_private_key
    
    sed -i "s/# GCP_PROJECT_ID=\"\"/GCP_PROJECT_ID=\"$gcp_project_id\"/" .env
    sed -i "s/# GCP_CLIENT_EMAIL=\"\"/GCP_CLIENT_EMAIL=\"$gcp_client_email\"/" .env
    sed -i "s/# GCP_PRIVATE_KEY=\"\"/GCP_PRIVATE_KEY=\"$gcp_private_key\"/" .env
    
    print_success "Google Cloud credentials configured"
fi

# OCI Configuration
read -p "Do you want to configure Oracle Cloud credentials? (y/n): " configure_oci
if [[ $configure_oci =~ ^[Yy]$ ]]; then
    read -p "Enter OCI User OCID: " oci_user_ocid
    read -p "Enter OCI Tenancy OCID: " oci_tenancy_ocid
    read -p "Enter OCI Fingerprint: " oci_fingerprint
    read -p "Enter OCI Private Key Path: " oci_private_key_path
    read -p "Enter OCI Region (default: us-ashburn-1): " oci_region
    oci_region=${oci_region:-us-ashburn-1}
    
    sed -i "s/# OCI_USER_OCID=\"\"/OCI_USER_OCID=\"$oci_user_ocid\"/" .env
    sed -i "s/# OCI_TENANCY_OCID=\"\"/OCI_TENANCY_OCID=\"$oci_tenancy_ocid\"/" .env
    sed -i "s/# OCI_FINGERPRINT=\"\"/OCI_FINGERPRINT=\"$oci_fingerprint\"/" .env
    sed -i "s/# OCI_PRIVATE_KEY_PATH=\"\"/OCI_PRIVATE_KEY_PATH=\"$oci_private_key_path\"/" .env
    sed -i "s/# OCI_REGION=\"us-ashburn-1\"/OCI_REGION=\"$oci_region\"/" .env
    
    print_success "Oracle Cloud credentials configured"
fi

# Database Configuration
echo ""
print_status "Database Configuration"
echo "=========================="
read -p "Do you want to change the database password? (y/n): " change_db_password
if [[ $change_db_password =~ ^[Yy]$ ]]; then
    read -s -p "Enter new database password: " new_db_password
    echo ""
    
    # Update .env file
    sed -i "s/secure_password_123/$new_db_password/" .env
    
    # Update database user password
    sudo -u postgres psql -c "ALTER USER cloud_cost_user PASSWORD '$new_db_password';"
    
    print_success "Database password updated"
fi

echo ""
print_success "Environment configuration completed!"
echo ""
echo "📋 Configuration Summary:"
echo "========================"
echo "• Environment file: .env"
echo "• Session secret: Generated and configured"
echo "• Database: PostgreSQL configured"
echo "• Cloud providers: Configured as requested"
echo ""
echo "🚀 Next Steps:"
echo "1. Run database migrations: npm run db:push"
echo "2. Build the application: npm run build"
echo "3. Start the service: sudo systemctl start cloud-cost-optimizer"
echo "4. Access the application: http://localhost:3000"
echo ""
print_success "Setup completed successfully!"
