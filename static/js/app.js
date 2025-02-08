// Add these constants at the top of your file, before the DOMContentLoaded event
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // Chain ID for Sepolia testnet
const SEPOLIA_NETWORK_CONFIG = {
    chainId: SEPOLIA_CHAIN_ID,
    chainName: 'Sepolia Test Network',
    nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'SEP',
        decimals: 18
    },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
};

// Add this function to check and switch networks
async function ensureSepoliaNetwork() {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        // Check current network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== SEPOLIA_CHAIN_ID) {
            try {
                // Try to switch to Sepolia
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID }],
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [SEPOLIA_NETWORK_CONFIG],
                        });
                    } catch (addError) {
                        throw new Error('Failed to add Sepolia network to MetaMask');
                    }
                } else {
                    throw new Error('Please switch to Sepolia Test Network in MetaMask');
                }
            }
        }
    } catch (error) {
        console.error('Network switch error:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const walletPrompt = document.getElementById('walletPrompt');
    const uploadForm = document.getElementById('uploadForm');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const documentForm = document.getElementById('documentForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const responseSection = document.getElementById('responseSection');
    const responseDetails = document.getElementById('responseDetails');
    const docCategory = document.getElementById('docCategory');
    const docType = document.getElementById('docType');

    // Check initial wallet state
    checkWalletConnection();

    // Listen for wallet connection events
    window.addEventListener('walletConnected', (event) => {
        showUploadForm();
    });

    window.addEventListener('walletDisconnected', () => {
        hideUploadForm();
    });

    function checkWalletConnection() {
        if (window.userWalletAddress) {
            showUploadForm();
        } else {
            hideUploadForm();
        }
    }

    function showUploadForm() {
        walletPrompt.classList.add('hidden');
        uploadForm.classList.remove('hidden');
    }

    function hideUploadForm() {
        walletPrompt.classList.remove('hidden');
        uploadForm.classList.add('hidden');
    }

    // Only proceed with file upload functionality if we're on the upload page
    if (dropZone && fileInput) {
        let selectedFile = null;
        let documentTypes = {};

        // Fetch document types from API
        fetch('/api/document-types')
            .then(response => response.json())
            .then(data => {
                documentTypes = data;
                // Populate categories dropdown
                Object.keys(data).forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    docCategory.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching document types:', error));

        // Handle category selection
        docCategory.addEventListener('change', function(e) {
            const category = e.target.value;
            docType.innerHTML = '<option value="">Select Document Type</option>';
            docType.disabled = !category;

            if (category && documentTypes[category]) {
                Object.entries(documentTypes[category]).forEach(([name, value]) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = name;
                    docType.appendChild(option);
                });
            }
        });

        // Initialize PinataAPI instance
        const pinataAPI = new PinataAPI();

        // Drag and drop handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropZone.classList.add('border-blue-500', 'bg-blue-50');
        }

        function unhighlight(e) {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        }

        // File Drop Handler
        dropZone.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            handleFile(file);
        }

        // File Input Change Handler
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            handleFile(file);
        });

        function handleFile(file) {
            if (!file) return;
            
            selectedFile = file;
            fileInfo.classList.remove('hidden');
            
            // Update the file info display
            const fileSize = formatFileSize(file.size);
            
            fileInfo.innerHTML = `
                <div class="flex items-center justify-center space-x-2">
                    <svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="font-medium">${file.name}</span>
                    <span class="text-gray-500">(${fileSize})</span>
                </div>
            `;
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Update the createDocumentWithMetaMask function to check network first
        async function createDocumentWithMetaMask(docType, category, fileCID) {
            try {
                // Check if MetaMask is installed
                if (!window.ethereum) {
                    throw new Error('MetaMask is not installed');
                }

                // Ensure we're on Sepolia network first
                await ensureSepoliaNetwork();

                // Request account access
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                const userAddress = accounts[0];

                // Get transaction data from backend
                const response = await fetch('http://localhost:3000/api/documents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        docType,
                        category,
                        fileCID,
                        wallet_address: userAddress
                    }),
                });

                const result = await response.json();
                console.log('Backend response:', result);

                if (!result.success) {
                    throw new Error(result.error || 'Failed to create document');
                }

                // Validate transaction data
                if (!result.txData || !result.txData.to || !result.txData.data) {
                    throw new Error('Invalid transaction data received from server');
                }

                // Estimate gas for the transaction
                const gasEstimate = await window.ethereum.request({
                    method: 'eth_estimateGas',
                    params: [{
                        from: userAddress,
                        to: result.txData.to,
                        data: result.txData.data
                    }]
                });

                // Add 20% buffer to gas estimate
                const gasLimit = Math.ceil(parseInt(gasEstimate, 16) * 1.2).toString(16);

                // Get current gas price
                const gasPrice = await window.ethereum.request({
                    method: 'eth_gasPrice'
                });

                // Prepare transaction with optimized gas settings
                const txParams = {
                    from: userAddress,
                    to: result.txData.to,
                    data: result.txData.data,
                    gas: `0x${gasLimit}`, // Optimized gas limit
                    maxFeePerGas: gasPrice, // Use current gas price
                    maxPriorityFeePerGas: '0x1', // Minimum priority fee
                };

                // Send transaction using MetaMask
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [txParams],
                });

                return {
                    success: true,
                    txHash,
                    docId: result.txData.docId || 'unknown'
                };

            } catch (error) {
                console.error('Detailed error:', error);
                if (error.code === 4001) {
                    throw new Error('Transaction rejected by user');
                }
                throw error;
            }
        }

        // Update the form submission handler to check network before upload
        documentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                // Validate inputs
                if (!selectedFile) {
                    throw new Error('Please select a file');
                }
                if (!docCategory.value || !docType.value) {
                    throw new Error('Please select document category and type');
                }

                uploadBtn.disabled = true;
                progressContainer.classList.remove('hidden');
                progressBar.style.width = '0%';
                progressBar.classList.remove('bg-red-500');
                
                // Check network first
                progressStatus.textContent = 'Checking network...';
                await ensureSepoliaNetwork();

                progressStatus.textContent = 'Uploading to IPFS...';

                // Upload to IPFS
                progressBar.style.width = '30%';
                const ipfsResult = await uploadToIPFS(selectedFile);
                
                progressBar.style.width = '60%';
                progressStatus.textContent = 'Waiting for transaction approval...';

                try {
                    // Create document with MetaMask in a nested try-catch
                    const result = await createDocumentWithMetaMask(
                        docType.value,
                        docCategory.value,
                        ipfsResult.ipfsHash
                    );

                    // Only show success if transaction was completed
                    progressBar.style.width = '100%';
                    progressStatus.textContent = 'Document created successfully!';

                    // Show success response
                    showResponse({
                        docId: result.docId,
                        message: 'Document created and transaction submitted',
                        hash: result.txHash
                    });

                } catch (txError) {
                    // Handle transaction-specific errors
                    progressBar.classList.add('bg-red-500');
                    progressBar.style.width = '100%';
                    
                    if (txError.code === 4001) {
                        progressStatus.textContent = 'Error: Transaction was rejected';
                        showError('Transaction was rejected by user. Document was not created.');
                    } else {
                        progressStatus.textContent = 'Error: ' + (txError.message || 'Transaction failed');
                        showError('Failed to create document: ' + (txError.message || 'Transaction failed'));
                    }
                    throw txError; // Re-throw to prevent further processing
                }

            } catch (error) {
                console.error('Upload error:', error);
                progressBar.classList.add('bg-red-500');
                progressBar.style.width = '100%';
                progressStatus.textContent = 'Error: ' + (error.message || 'Failed to create document');
            } finally {
                uploadBtn.disabled = false;
            }
        });

        // Add a function to show error messages
        function showError(message) {
            responseSection.classList.remove('hidden');
            responseDetails.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center">
                        <svg class="h-6 w-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="font-medium text-red-600">Error</span>
                    </div>
                    <div class="bg-red-50 border border-red-200 p-4 rounded-lg text-sm space-y-2">
                        <p class="text-red-700">${message}</p>
                    </div>
                </div>
            `;
        }

        // Update the showResponse function to be more explicit about success
        function showResponse(response) {
            responseSection.classList.remove('hidden');
            responseDetails.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center">
                        <svg class="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="font-medium text-green-600">Success!</span>
                    </div>
                    <div class="bg-green-50 border border-green-200 p-4 rounded-lg font-mono text-sm space-y-2">
                        <p><span class="text-gray-600">Document ID:</span> ${response.docId}</p>
                        <p><span class="text-gray-600">Status:</span> ${response.message}</p>
                        <p class="pt-2">
                            <span class="text-gray-600">Transaction Hash:</span>
                            <a href="https://sepolia.etherscan.io/tx/${response.hash}" 
                               target="_blank" 
                               class="text-blue-500 hover:text-blue-600 break-all">
                                ${response.hash}
                            </a>
                        </p>
                    </div>
                </div>
            `;
        }

        // Update the upload function to use pinataAPI
        async function uploadToIPFS(file) {
            try {
                const result = await pinataAPI.uploadFile(file);
                return result;
            } catch (error) {
                console.error('Error uploading to IPFS:', error);
                throw error;
            }
        }
    }
}); 