#!/bin/bash

# Python Parser Installation Script
echo "🐍 Installing Python Parser for Vedabase.io"
echo "=============================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi

echo "✅ pip3 found: $(pip3 --version)"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing Python packages..."
pip install -r requirements.txt

# Copy .env file if it exists
if [ -f "../.env" ]; then
    echo "📋 Copying .env file..."
    cp ../.env .env
    echo "✅ .env file copied"
else
    echo "⚠️  .env file not found. Please create one with DATABASE_URL"
fi

# Test installation
echo "🧪 Testing installation..."
python test_parser.py

echo ""
echo "🎉 Installation completed!"
echo ""
echo "To use the parser:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Run parser: python main.py --text-type bg"
echo "3. Check stats: python main.py --stats"
echo ""
echo "For more options: python main.py --help"
