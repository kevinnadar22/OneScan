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

        // Form submission
        documentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!selectedFile) {
                alert('Please select a file first');
                return;
            }

            if (!docCategory.value || !docType.value) {
                alert('Please select both document category and type');
                return;
            }

            // Show progress
            progressContainer.classList.remove('hidden');
            progressBar.style.width = '0%';
            progressStatus.textContent = 'Uploading to IPFS...';
            uploadBtn.disabled = true;

            try {
                // Check wallet connection
                if (!window.userWalletAddress) {
                    throw new Error('Wallet connection required');
                }

                // First upload to IPFS
                progressBar.style.width = '30%';
                const ipfsResult = await uploadToIPFS(selectedFile);
                
                progressBar.style.width = '60%';
                progressStatus.textContent = 'Creating document record...';

                // Prepare payload for API
                const payload = {
                    docType: docType.value,
                    category: docCategory.value,
                    fileCID: ipfsResult.ipfsHash,
                    wallet_address: window.userWalletAddress
                };

                // Send to API
                const response = await fetch('http://localhost:3000/api/documents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                progressBar.style.width = '100%';
                progressStatus.textContent = 'Upload complete!';

                const result = await response.json();
                showResponse(result);
            } catch (error) {
                console.error('Error:', error);
                progressStatus.textContent = 'Error: ' + error.message;
                progressBar.classList.add('bg-red-500');
            } finally {
                uploadBtn.disabled = false;
            }
        });

        function showResponse(response) {
            responseSection.classList.remove('hidden');
            responseDetails.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center">
                        <svg class="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="font-medium">Document uploaded successfully!</span>
                    </div>
                    <div class="bg-gray-100 p-4 rounded-lg font-mono text-sm space-y-2">
                        <p><span class="text-gray-600">Document ID:</span> ${response.docId}</p>
                        <p><span class="text-gray-600">Status:</span> ${response.message}</p>
                        <p class="pt-2">
                            <span class="text-gray-600">View on Sepolia:</span>
                            <a href="https://sepolia.etherscan.io/tx/${response.hash}" 
                               target="_blank" 
                               class="text-blue-500 hover:text-blue-600 break-all">
                                https://sepolia.etherscan.io/tx/${response.hash}
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