class PinataAPI {
    constructor() {
        this.baseUrl = 'https://api.pinata.cloud';
        // You'll need to replace these with your actual Pinata API keys
        this.apiKey = '1741bf826380d3a0a862';
        this.apiSecret = 'c57876123c4304484d2d440181def316a410716d43185d3cf2c544c9b4e2301c';
        this.JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmYTdhY2E5Ny00Njg3LTQzZDQtODJjYy1kOWZiYmMxNjliMDUiLCJlbWFpbCI6Implc2lrYW1hcmFqQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIxNzQxYmY4MjYzODBkM2EwYTg2MiIsInNjb3BlZEtleVNlY3JldCI6ImM1Nzg3NjEyM2M0MzA0NDg0ZDJkNDQwMTgxZGVmMzE2YTQxMDcxNmQ0MzE4NWQzY2YyYzU0NGM5YjRlMjMwMWMiLCJleHAiOjE3NzA0ODU3ODV9.1XYa8YfMeJr70XnHoui08YyA4i88G9Izje-ZPXJvB0U';
    }

    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            formData.append('pinataMetadata', JSON.stringify({
                name: file.name,
                keyvalues: {
                    type: file.type,
                    size: file.size
                }
            }));

            const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.apiSecret,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                ipfsHash: data.IpfsHash,
                gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
            };
        } catch (error) {
            console.error('Error uploading to Pinata:', error);
            throw error;
        }
    }

    async testAuthentication() {
        try {
            const response = await fetch(`${this.baseUrl}/data/testAuthentication`, {
                headers: {
                    'Authorization': `Bearer ${this.JWT}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Authentication test failed:', error);
            return false;
        }
    }
} 