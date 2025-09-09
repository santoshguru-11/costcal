#!/bin/bash

# Cloud Cost Optimizer Database Setup Script
# This script sets up the PostgreSQL database for the Cloud Cost Optimizer application

echo "🚀 Setting up Cloud Cost Optimizer Database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw cloud_cost_optimizer; then
    echo "📋 Database 'cloud_cost_optimizer' already exists."
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Dropping existing database..."
        psql -c "DROP DATABASE IF EXISTS cloud_cost_optimizer;"
    else
        echo "ℹ️  Using existing database."
    fi
fi

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw cloud_cost_optimizer; then
    echo "📦 Creating database 'cloud_cost_optimizer'..."
    createdb cloud_cost_optimizer
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully!"
    else
        echo "❌ Failed to create database."
        exit 1
    fi
fi

# Run the database setup script
echo "🔧 Running database setup script..."
psql -d cloud_cost_optimizer -f database_setup.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database setup completed successfully!"
    echo ""
    echo "📊 Database Summary:"
    echo "   - Database: cloud_cost_optimizer"
    echo "   - User: cloud_cost_user"
    echo "   - Password: 1101"
    echo "   - Test User: darbhasantosh11@gmail.com"
    echo "   - Test Password: 1101"
    echo ""
    echo "🔗 Connection string:"
    echo "   postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer"
    echo ""
    echo "✅ You can now start the application with: npm start"
else
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi
