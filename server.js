import express from 'express';
import cors from 'cors';
import createDocument from './api/documentApiExample.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// POST endpoint to create document
app.post('/api/documents', async (req, res) => {
    try {
        const { docType, category, fileCID } = req.body;
        // habe a constant value for name and description
        const name = "";
        const description = "";
        
        // Validate required fields
        if (!docType || !category || !fileCID) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await createDocument(
            name,
            description,
            docType,
            category,
            fileCID
        );

        if (result.success) {
            res.status(201).json(result);
        } else {
            // Changed to 500 status for blockchain-related errors
            res.status(500).json({
                ...result,
                message: 'Failed to create document on blockchain'
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 