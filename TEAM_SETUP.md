# Kryptos Certificate Verification - Team Setup Guide

## 🚀 Quick Start for New Team Members

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Blockfrost API key (free from https://blockfrost.io/)

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd Kryptos
npm install
cd backend && npm install && cd ..
```

### 2. Environment Configuration

#### Frontend Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and replace the placeholder:
# REACT_APP_BLOCKFROST_API_KEY=your_actual_api_key_here
```

#### Backend Setup
```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit backend/.env and replace the placeholder:
# BLOCKFROST_API_KEY=your_actual_api_key_here
```

### 3. Get Your Blockfrost API Key
1. Go to https://blockfrost.io/
2. Sign up for a free account
3. Create a new project
4. Select **"Cardano Preprod"** network (important!)
5. Copy your project ID - this is your API key
6. It should look like: `preprod...` followed by letters and numbers

### 4. Update Your Environment Files
Edit both `.env` files and replace `your_blockfrost_api_key_here` with your actual API key.

### 5. Start the Application
```bash
# Terminal 1 - Start Backend
cd backend
npm start

# Terminal 2 - Start Frontend (in project root)
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## 🔧 Configuration Details

### Environment Variables Explained

#### Frontend (`.env`)
- `REACT_APP_BLOCKFROST_API_KEY`: Your Blockfrost project ID for preprod network
- `REACT_APP_CARDANO_NETWORK`: Blockchain network (use "preprod" for testing)

#### Backend (`backend/.env`)
- `BLOCKFROST_API_KEY`: Your Blockfrost project ID (same as frontend)
- `PORT`: Backend server port (default: 5001)
- `NETWORK`: Blockchain network (use "preprod" for testing)

## 🛡️ Security Notes
- ❌ **NEVER** commit actual API keys to git
- ✅ The `.env` files are in `.gitignore` for security
- ✅ Use `.env.example` files as templates only
- ✅ Each team member needs their own Blockfrost API key (they're free)
- ✅ Keep your API keys private and secure

## 📝 Troubleshooting

### Common Issues

**"Blockfrost API key not configured"**
- Check that your `.env` files exist in the correct locations
- Verify API key is correctly set (no quotes needed)
- Restart both frontend and backend servers after changing `.env` files

**"Network connection failed"**
- Verify your internet connection
- Check Blockfrost service status at https://blockfrost.io/
- Ensure your API key is for the "preprod" network

**"Certificate verification fails"**
- Wait 1-2 minutes for blockchain indexing after issuing a certificate
- Verify you're using the same wallet that issued the certificate
- Ensure you're on the correct network (preprod for testing)

**Environment variables not loading**
- Make sure `.env` files are in the correct directories:
  - `/Kryptos/.env` (frontend)
  - `/Kryptos/backend/.env` (backend)
- Restart the development servers after making changes
- Check that variable names start with `REACT_APP_` for frontend

## 🔄 Development Workflow

1. **Make code changes** (but don't modify `.env` files)
2. **Test locally** with your own environment files
3. **Commit and push** code changes (`.env` files are automatically ignored)
4. **Team members pull changes** and use their own `.env` files
5. **New team members** follow this setup guide

## 🚀 Features
- Issue digital certificates on Cardano blockchain
- Verify certificate authenticity using blockchain data
- Extract and display certificate metadata (filename, issuer, issue date)
- Secure API key management with environment variables

## 📞 Need Help?
If you encounter issues:
1. Check this troubleshooting guide first
2. Verify your Blockfrost API key is working at https://blockfrost.io/
3. Ask team members for help with setup

---
*Remember: Each developer needs their own free Blockfrost API key for testing!*
