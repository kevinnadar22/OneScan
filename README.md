# OneScan - Secure & Seamless Data Sharing

> **Repository Structure:** This main branch contains the Flask frontend application. The backend API can be found in the [API branch](https://github.com/kevinnadar22/OneScan/tree/api) and is run using `node server.js`.

## Demo

| Organization Perspective | User Perspective |
|--------------------------|------------------|
| **Features for Organizations:** | **Features for Users:** |
| - Create customized digital forms | - Secure document storage |
| - Generate QR codes for data collection | - One-click document sharing |
| - Verify document authenticity | - Privacy controls for data sharing |
| - Process submissions efficiently | - Document history tracking |
| - Maintain compliance with data regulations | - Revoke access as needed |
| | |
| **Demo Video:** | **Demo Video:** |
| [Organization Demo Video](https://drive.google.com/file/d/1WyPHV8_TnA7uw-b89sb87sje2dbYXkSq/preview) | [User Demo Video](https://drive.google.com/file/d/1YB955wqp2CYFuj5Uj3qeom9duKDhTxi7/preview) |

## Overview
OneScan is a modern solution for secure document management and sharing that eliminates the need for physical forms and paperwork. It provides a blockchain-secured platform where users can store their documents and share them with organizations via QR codes.

## Problem Statement
- Traditional document sharing methods rely on repetitive form-filling at every organization
- Physical paperwork is prone to loss, damage, and unauthorized access
- Manual data entry causes errors and inefficiencies
- Users lack control over who accesses their information and for how long
- Organizations struggle with document verification and authenticity

## Solution
- Decentralized document storage using blockchain technology
- QR-based instant data sharing between users and organizations
- User-controlled privacy settings for selective information sharing
- Tamper-proof document verification and authentication
- Efficient workflow for both users and organizations

## Tech Stack
- **Backend**: Flask, SQLAlchemy, SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Blockchain**: Solidity smart contracts, Ethereum
- **Storage**: IPFS (Pinata) for decentralized document storage
- **Development Tools**: Truffle, Ganache

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js and npm
- Ganache (for local blockchain development)
- MetaMask browser extension

### Frontend Setup (Main Branch)
```bash
# Clone the repository
git clone https://github.com/kevinnadar22/OneScan.git
cd OneScan

# Install frontend dependencies
pip install -r requirements.txt

# Initialize the database
python init_db.py

# Run the frontend application
python app.py
```

### Backend API Setup (API Branch)
```bash
# Clone the repository and checkout the API branch
git clone https://github.com/kevinnadar22/OneScan.git
cd OneScan
git checkout api

# Install backend dependencies
npm install

# Run the backend server
node server.js
```

### Blockchain Setup (Optional for Development)
```bash
# Start Ganache for local blockchain development
# (Download Ganache from https://trufflesuite.com/ganache/)

# Deploy smart contracts (from the API branch)
cd contracts
truffle migrate --network development
```

## Organization Side

Organizations can use OneScan to digitize their document collection and verification processes. The platform provides:

1. **Form Creation Interface**: Build custom digital forms specifying required documents
2. **QR Generation**: Create unique QR codes for each form that users can scan
3. **Submission Management**: View, approve, or reject document submissions
4. **Verification System**: Authenticate documents using blockchain verification
5. **Compliance Tools**: Maintain regulatory compliance with secure data handling

### Organization Demo

[Organization Demo Video](https://drive.google.com/file/d/1WyPHV8_TnA7uw-b89sb87sje2dbYXkSq/preview)

## User Side

Users enjoy a seamless experience for document management and sharing:

1. **Digital Wallet**: Store all important documents securely in one place
2. **Scan & Share**: Scan organization QR codes to instantly share required documents
3. **Privacy Controls**: Choose exactly which documents to share with each organization
4. **Document History**: Track which organizations have access to your documents
5. **Access Management**: Revoke shared access to documents at any time

### User Demo

[User Demo Video](https://drive.google.com/file/d/1YB955wqp2CYFuj5Uj3qeom9duKDhTxi7/preview)

## Contributors
- [Maria Kevin](https://github.com/kevinnadar22)
- [Benedict Raymond](https://github.com/BenedictRaymond)

## License
This project is licensed under the MIT License - see the LICENSE file for details.


