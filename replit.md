# Cloud Cost Optimizer

## Overview

Cloud Cost Optimizer is a professional-grade web application designed to replicate the functionality and interface of Oracle's official cost estimator. The application provides enterprise-level cloud infrastructure cost comparison and optimization across multiple cloud providers (AWS, Azure, GCP, and Oracle Cloud) through a sophisticated catalog-based interface.

The system features a comprehensive service catalog with detailed specifications, reference architectures for common use cases, compute shape configurations, and professional cost estimation tools. Users can browse services by category, select from pre-built reference architectures, or configure individual services to build custom infrastructure estimates with detailed breakdowns and optimization recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Interface Design**: Professional Oracle-style cost estimator interface with sidebar navigation and service catalog
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management with local component state for UI interactions
- **Styling**: Tailwind CSS with shadcn/ui component library for enterprise-grade design consistency
- **Service Catalog**: Comprehensive multi-provider service browser with detailed specifications and pricing
- **Reference Architectures**: Pre-built solution templates for common use cases (Web Apps, AI/ML, Data Analytics)
- **Charts**: Advanced Chart.js integration with sustainability metrics and service-by-service comparisons

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API endpoints for cost calculations and analysis retrieval
- **Request Handling**: JSON-based request/response with comprehensive error handling
- **Logging**: Custom request logging middleware for API monitoring

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (@neondatabase/serverless) for serverless PostgreSQL
- **Development Storage**: In-memory storage implementation for development/testing
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Data Models**: Structured cost analysis storage with JSON fields for flexible requirement and result storage

### Authentication and Authorization
- **Session Management**: Basic session handling (prepared for future enhancement)
- **Security**: CORS enabled, JSON parsing middleware, and request validation

### Cost Calculation Engine
- **Pricing Data**: Static JSON-based pricing database with regional multipliers
- **Calculation Logic**: Modular cost calculator supporting multiple cloud providers
- **Provider Support**: AWS, Azure, GCP, and Oracle Cloud with service-specific pricing
- **Multi-cloud Optimization**: Advanced algorithm to recommend optimal service distribution across providers
- **Cost Categories**: Separate calculations for compute, storage, database, and networking costs

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL provider for production database hosting
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL operations
- **Connection Management**: Environment-based database URL configuration

### UI and Styling Libraries
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives
- **Radix UI**: Accessible component primitives for dialogs, forms, navigation, and data display
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography

### Development and Build Tools
- **Vite**: Fast build tool with hot module replacement and optimized production builds
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production server builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for forms and API requests
- **Hookform Resolvers**: Integration between React Hook Form and Zod validation

### Data Fetching and State
- **TanStack React Query**: Server state management with caching, synchronization, and background updates
- **Custom API Client**: Fetch-based HTTP client with error handling and credential management

### Chart and Visualization
- **Chart.js**: External JavaScript charting library loaded dynamically for cost visualizations
- **Custom Chart Components**: React wrappers for Chart.js integration with cost data

### Deployment and Hosting
- **Replit Integration**: Development environment integration with runtime error overlays
- **Environment Configuration**: NODE_ENV-based configuration for development and production
- **Static Asset Serving**: Vite-based static file serving in development, Express static serving in production