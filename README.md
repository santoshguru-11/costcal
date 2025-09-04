# Cloud Cost Optimizer

A comprehensive cloud cost optimization platform that analyzes infrastructure across multiple cloud providers, provides cost comparisons, and generates detailed reports. Built with React, TypeScript, Node.js, and PostgreSQL.

## 🚀 Features

### 📊 Multi-Cloud Cost Analysis
- **AWS, Azure, GCP, Oracle Cloud** support
- Real-time cost calculations and comparisons
- Comprehensive pricing data for 200+ services
- Multi-region cost analysis

### 🔍 Infrastructure Discovery
- **Terraform State File Parsing** - Upload `.tfstate` files for instant analysis
- **OCI CLI Integration** - Real-time Oracle Cloud resource discovery
- **Cloud Provider APIs** - Direct integration with cloud services
- **Resource Categorization** - Automatic service classification

### 📋 Inventory Management
- **Resource Filtering** - Filter by service, provider, region
- **Search Functionality** - Find resources by name, type, or service
- **Visual Resource Table** - Detailed resource information with icons
- **Compartment/Resource Group** tracking

### 📄 Reporting & Export
- **PDF Report Generation** - Professional cost analysis reports
- **CSV Export** - Data export for further analysis
- **Visual Charts** - Cost breakdown charts and graphs
- **Multi-page PDF** support with automatic pagination

### 🔐 Authentication & Security
- **Email/Password Authentication** - Secure user management
- **Session Management** - Persistent login sessions
- **Protected Routes** - Secure API endpoints
- **Credential Encryption** - Secure cloud credential storage

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Query** for data fetching
- **Wouter** for routing

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with Drizzle ORM
- **Passport.js** for authentication
- **Bcrypt** for password hashing

### Cloud Integrations
- **AWS SDK v2** for AWS services
- **Azure SDK** for Azure services
- **Google Cloud SDK** for GCP services
- **OCI SDK** for Oracle Cloud services
- **OCI CLI** for resource discovery

### PDF Generation
- **jsPDF** for PDF creation
- **html2canvas** for HTML to image conversion

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- OCI CLI (for Oracle Cloud integration)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/santoshguru-11/inventory_cost.git
   cd inventory_cost
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cloud_cost_optimizer"
   SESSION_SECRET="your-session-secret"
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🎯 Usage

### 1. Authentication
- Navigate to `/login` to create an account or sign in
- Secure email/password authentication system

### 2. Cloud Credentials Setup
- Go to `/credentials` to add your cloud provider credentials
- Supports AWS, Azure, GCP, and Oracle Cloud
- Credentials are encrypted and stored securely

### 3. Terraform State Analysis
- Navigate to `/terraform` to upload your `.tfstate` files
- View parsed resources in a detailed table
- Automatic cost analysis generation
- Export results as PDF reports

### 4. Inventory Scanning
- Go to `/inventory` to scan your cloud resources
- Real-time resource discovery
- Filter and search through resources
- Generate cost analysis from discovered resources

### 5. Cost Analysis
- View detailed cost breakdowns across providers
- Compare costs between different cloud providers
- Generate PDF reports with charts and recommendations
- Export data for further analysis

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/auth/user` - Get current user

### Terraform Analysis
- `POST /api/terraform/parse` - Parse Terraform state files
- `POST /api/inventory/analyze-costs` - Generate cost analysis

### Inventory Management
- `POST /api/inventory/scan` - Scan cloud resources
- `POST /api/inventory/validate-credentials` - Validate cloud credentials

### Cost Analysis
- `POST /api/calculate` - Calculate costs
- `GET /api/analysis/:id` - Get analysis by ID
- `GET /api/analyses` - Get user's analyses

## 📊 Supported Resource Types

### AWS Resources
- EC2 Instances, Auto Scaling Groups
- S3 Buckets, EBS Volumes, EFS
- RDS, DynamoDB, ElastiCache, Redshift
- Load Balancers, VPC, Security Groups
- Lambda Functions, ECS, EKS
- CloudWatch, Route53, CloudFront

### Azure Resources
- Virtual Machines, Scale Sets
- Storage Accounts, Managed Disks
- SQL Databases, CosmosDB, Redis Cache
- Load Balancers, VNets, Network Security Groups
- Function Apps, Container Groups, AKS
- Application Insights, DNS Zones

### Google Cloud Resources
- Compute Engine, Instance Groups
- Cloud Storage, Persistent Disks
- Cloud SQL, Firestore, Bigtable
- Load Balancers, VPC, Firewalls
- Cloud Functions, GKE, Cloud Run
- Logging, DNS, Cloud CDN

### Oracle Cloud Resources
- Compute Instances, Instance Pools
- Object Storage, Block Volumes
- Autonomous Database, NoSQL
- Load Balancers, VCN, Security Lists
- Functions, OKE (Oracle Kubernetes Engine)
- Logging, Monitoring, DNS

## 🎨 Screenshots

### Terraform State Analysis
- Upload `.tfstate` files
- View parsed resources in detailed table
- Automatic cost analysis generation

### Inventory Management
- Real-time resource discovery
- Service and search filtering
- Visual resource categorization

### Cost Analysis Reports
- Multi-cloud cost comparisons
- Detailed cost breakdowns
- PDF report generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@cloudcostoptimizer.com or create an issue in the GitHub repository.

## 🔮 Roadmap

- [ ] Kubernetes cost analysis
- [ ] Reserved instance recommendations
- [ ] Cost anomaly detection
- [ ] Multi-account/tenant support
- [ ] API rate limiting and optimization
- [ ] Advanced cost forecasting
- [ ] Integration with more cloud providers

## 📈 Performance

- **Fast Resource Discovery** - OCI CLI integration discovers 100+ resources in seconds
- **Efficient Parsing** - Terraform state files parsed in milliseconds
- **Optimized Queries** - Database queries optimized with Drizzle ORM
- **Caching** - React Query provides intelligent caching
- **Lazy Loading** - Components loaded on demand

## 🛡️ Security

- **Encrypted Credentials** - Cloud credentials encrypted at rest
- **Secure Sessions** - HTTP-only cookies with secure flags
- **Input Validation** - All inputs validated and sanitized
- **SQL Injection Protection** - Drizzle ORM prevents SQL injection
- **XSS Protection** - React's built-in XSS protection

---

**Built with ❤️ for cloud cost optimization**
