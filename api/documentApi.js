import Web3 from 'web3';


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

  async decodeTransactionDataByTx(tx) {
    try {
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
      
      return {
        decodedTransaction: decodedData,
      };
    } catch (error) {
      console.error('Error getting document from transaction:', error);
      throw error;
    }
  }

  // Get all transactions by owner address
  async getTransactionsByOwner(ownerAddress) {
    try {
      if (!process.env.ETHERSCAN_API_KEY) {
        throw new Error('ETHERSCAN_API_KEY not configured in .env file');
      }

      const API_KEY = process.env.ETHERSCAN_API_KEY;
      const baseUrl = 'https://api-sepolia.etherscan.io/api'; // Using Sepolia network
      
      const url = `${baseUrl}?module=account&action=txlist&address=${ownerAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "1" && data.result) {
        // Filter transactions that interact with our contract
        const contractTransactions = data.result.filter(tx => 
          tx.to && tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
        );

        // Map the transactions to include only required fields
        return contractTransactions.map(tx => ({
          hash: tx.hash,
          blockNumber: parseInt(tx.blockNumber),
          input: tx.input,
          to: tx.to,
          from: tx.from,
          timeStamp: tx.timeStamp
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch transactions from Etherscan');
      }
    } catch (error) {
      console.error('Error getting transactions by owner:', error);
      throw error;
    }
  }
}

export default DocumentStorageAPI;