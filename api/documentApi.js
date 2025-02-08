import Web3 from 'web3';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/103691/document-storage/v0.0.1';
const CONTRACT_ADDRESS = '0xcA66644908Cfb44C84A81585c6E24233c9fA89DA';

// Network configurations
const NETWORKS = {
  mainnet: 'https://mainnet.infura.io/v3/',
  goerli: 'https://goerli.infura.io/v3/',
  sepolia: 'https://sepolia.infura.io/v3/',
  polygon: 'https://polygon-mainnet.infura.io/v3/',
  mumbai: 'https://polygon-mumbai.infura.io/v3/'
};

// ABI for the document storage contract
const CONTRACT_ABI = [
  {
    "inputs": [
      {"name": "_docId", "type": "bytes32"},
      {"name": "_name", "type": "string"},
      {"name": "_description", "type": "string"},
      {"name": "_docType", "type": "string"},
      {"name": "_category", "type": "string"},
      {"name": "_fileCID", "type": "string"}
    ],
    "name": "addDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class DocumentStorageAPI {
  constructor(web3Provider = null, infuraConfig = null) {
    this.endpoint = SUBGRAPH_URL;
    
    // Initialize Web3 with Infura if config is provided
    if (infuraConfig) {
      const { projectId, network = 'sepolia' } = infuraConfig;
      const networkUrl = `${NETWORKS[network]}${projectId}`;
      this.web3 = new Web3(new Web3.providers.HttpProvider(networkUrl));
    } else {
      this.web3 = web3Provider || new Web3(Web3.givenProvider);
    }
    
    this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
  }

  // Create a new document
  async createDocument(name, description, docType, category, fileCID, fromAddress) {
    try {
      // Create a unique document ID using keccak256 hash
      const docId = this.web3.utils.soliditySha3(
        name,
        description,
        docType,
        category,
        fileCID,
        Date.now().toString()
      );

      // Estimate gas for the transaction
      const gasEstimate = await this.contract.methods.addDocument(
        docId,
        name,
        description,
        docType,
        category,
        fileCID
      ).estimateGas({ from: fromAddress });

      // Prepare the transaction with estimated gas
      const tx = await this.contract.methods.addDocument(
        docId,
        name,
        description,
        docType,
        category,
        fileCID
      ).send({ 
        from: fromAddress,
        gas: Math.ceil(gasEstimate * 1.2) // Add 20% buffer to gas estimate
      });
      console.log(tx);

      return {
        success: true,
        docId: docId,
        transactionHash: tx.transactionHash
      };
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async fetchGraphQL(query, variables = {}) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  // Get all documents
  async getAllDocuments() {
    const query = `
      query {
        documents {
          id
          docId
          name
          description
          docType
          category
          fileCID
          createdAt
          owner
          exists
        }
      }
    `;

    const response = await this.fetchGraphQL(query);
    return response.data.documents;
  }

  // Get document by ID
  async getDocumentById(docId) {
    const query = `
      query($docId: ID!) {
        document(id: $docId) {
          id
          docId
          name
          description
          docType
          category
          fileCID
          createdAt
          owner
          exists
        }
      }
    `;

    const response = await this.fetchGraphQL(query, { docId });
    return response.data.document;
  }

  // Get documents by owner address
  async getDocumentsByOwner(ownerAddress) {
    const query = `
      query($owner: Bytes!) {
        documents(where: { owner: $owner }) {
          id
          docId
          name
          description
          docType
          category
          fileCID
          createdAt
          owner
          exists
        }
      }
    `;

    const response = await this.fetchGraphQL(query, { owner: ownerAddress });
    return response.data.documents;
  }

  // Search documents by category
  async searchDocumentsByCategory(category) {
    const query = `
      query($category: String!) {
        documents(where: { category: $category }) {
          id
          docId
          name
          description
          docType
          category
          fileCID
          createdAt
          owner
          exists
        }
      }
    `;

    const response = await this.fetchGraphQL(query, { category });
    return response.data.documents;
  }

  // Search documents by type
  async searchDocumentsByType(docType) {
    const query = `
      query($docType: String!) {
        documents(where: { docType: $docType }) {
          id
          docId
          name
          description
          docType
          category
          fileCID
          createdAt
          owner
          exists
        }
      }
    `;

    const response = await this.fetchGraphQL(query, { docType });
    return response.data.documents;
  }

  // Decode transaction data to get document values
  async decodeTransactionData(txHash) {
    try {
      // Get transaction details
      const tx = await this.web3.eth.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Get transaction input data
      const inputData = tx.input;

      // Decode the input data using contract ABI
      const decodedData = this.web3.eth.abi.decodeParameters(
        ['bytes32', 'string', 'string', 'string', 'string', 'string'],
        '0x' + inputData.slice(10) // Remove function selector (first 10 characters)
      );

      // Return decoded document data in a structured format
      return {
        docId: decodedData[0],
        name: decodedData[1],
        description: decodedData[2],
        docType: decodedData[3],
        category: decodedData[4],
        fileCID: decodedData[5]
      };
    } catch (error) {
      console.error('Error decoding transaction:', error);
      throw error;
    }
  }

  // Get full document details from transaction hash
  async getDocumentFromTransaction(txHash) {
    try {
      // First decode the transaction data
      const decodedData = await this.decodeTransactionData(txHash);
      
      // Then fetch the actual document from the blockchain using the decoded docId
      const document = await this.getDocumentById(decodedData.docId);
      
      return {
        decodedTransaction: decodedData,
        documentOnChain: document
      };
    } catch (error) {
      console.error('Error getting document from transaction:', error);
      throw error;
    }
  }
}

export default DocumentStorageAPI;