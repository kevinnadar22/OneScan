import DocumentStorageAPI from '../api/documentApi.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API function to create a document
async function createDocument(name, description, docType, category, fileCID) {
    try {
        if (!process.env.INFURA_PROJECT_ID) {
            throw new Error('Please set INFURA_PROJECT_ID in your .env file');
        }

        if (!process.env.PRIVATE_KEY) {
            throw new Error('Please set PRIVATE_KEY in your .env file');
        }

        // Initialize with Infura
        const infuraConfig = {
            projectId: process.env.INFURA_PROJECT_ID,
            network: 'sepolia'
        };
        
        const api = new DocumentStorageAPI(null, infuraConfig);

        // Set up wallet with private key
        const privateKey = `0x${process.env.PRIVATE_KEY}`;
        const account = api.web3.eth.accounts.privateKeyToAccount(privateKey);
        api.web3.eth.accounts.wallet.add(account);
        const fromAddress = account.address;

        // Create document
        const newDoc = await api.createDocument(
            name,
            description, 
            docType,
            category,
            fileCID,
            fromAddress
        );

        return {
            success: true,
            docId: newDoc.docId,
            message: 'Document created successfully',
            hash: newDoc.transactionHash
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            details: error.receipt || null
        };
    }
}

export default createDocument;