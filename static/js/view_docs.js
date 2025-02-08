document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const documentsTableBody = document.getElementById('documentsTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const startRange = document.getElementById('startRange');
    const endRange = document.getElementById('endRange');
    const totalItems = document.getElementById('totalItems');
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const itemsPerPage = document.getElementById('itemsPerPage');
    const previewModal = document.getElementById('previewModal');
    const closePreview = document.getElementById('closePreview');
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    const viewOnIPFS = document.getElementById('viewOnIPFS');
    const viewOnEtherscan = document.getElementById('viewOnEtherscan');

    // State
    let currentPage = 1;
    let documentTypes = {};
    let currentFilters = {
        category: '',
        type: '',
        limit: 10
    };

    // Initialize
    init();

    async function init() {
        await fetchDocumentTypes();
        populateFilters();
        fetchDocuments();
        setupEventListeners();
    }

    async function fetchDocumentTypes() {
        try {
            const response = await fetch('/api/document-types');
            documentTypes = await response.json();
        } catch (error) {
            console.error('Error fetching document types:', error);
        }
    }

    function populateFilters() {
        // Populate category filter
        Object.keys(documentTypes).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Handle category change
        categoryFilter.addEventListener('change', function(e) {
            const category = e.target.value;
            currentFilters.category = category;
            currentFilters.type = '';
            typeFilter.innerHTML = '<option value="">All Types</option>';

            if (category && documentTypes[category]) {
                Object.entries(documentTypes[category]).forEach(([name, value]) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = name;
                    typeFilter.appendChild(option);
                });
            }

            currentPage = 1;
            fetchDocuments();
        });
    }

    function setupEventListeners() {
        // Filter changes
        typeFilter.addEventListener('change', function(e) {
            currentFilters.type = e.target.value;
            currentPage = 1;
            fetchDocuments();
        });

        itemsPerPage.addEventListener('change', function(e) {
            currentFilters.limit = parseInt(e.target.value);
            currentPage = 1;
            fetchDocuments();
        });

        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchDocuments();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            fetchDocuments();
        });

        // Modal
        closePreview.addEventListener('click', () => {
            previewModal.classList.add('hidden');
        });

        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                previewModal.classList.add('hidden');
            }
        });
    }

    async function fetchDocuments() {
        showLoading();

        try {
            const connectedAddress = '0x82aF2B0E6e414E8E761336324eaCe3d09e3c4AFD';
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: currentFilters.limit,
                ...(currentFilters.category && { category: currentFilters.category }),
                ...(currentFilters.type && { type: currentFilters.type })
            });

            const response = await fetch(`http://localhost:3000/api/documents/owner/${connectedAddress}?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                const documents = data.data?.transactions || [];
                
                if (!documents || documents.length === 0) {
                    hideLoading();
                    showEmpty();
                    return;
                }

                renderDocuments(documents);
                hideEmpty();
                
                // Update pagination if pagination data exists
                if (data.pagination) {
                    updatePagination(data.pagination);
                } else {
                    // Default pagination values if not provided
                    updatePagination({
                        currentPage: 1,
                        totalPages: 1,
                        limit: documents.length,
                        totalTransactions: documents.length
                    });
                }
            } else {
                throw new Error('Failed to fetch documents');
            }
        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            showError();
        }
    }

    function renderDocuments(documents) {
        if (!documents || !documents.length) {
            showEmpty();
            return;
        }

        hideLoading();
        hideEmpty();
        documentsTableBody.innerHTML = '';

        documents.forEach(doc => {
            // Get the human-readable document type name
            const docTypeName = getDocumentTypeName(doc.decodedData.category, doc.decodedData.docType);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${docTypeName}</div>
                            <div class="text-xs text-gray-500">${formatDate(doc.timeStamp)}</div>
                            <div class="text-xs text-gray-400 mt-1 font-mono">${doc.decodedData.fileCID.slice(0, 6)}...${doc.decodedData.fileCID.slice(-4)}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${doc.decodedData.category}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="showPreview('${doc.hash}', ${JSON.stringify(doc.decodedData).replace(/"/g, '&quot;')})" 
                            class="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>View</span>
                    </button>
                </td>
            `;
            documentsTableBody.appendChild(tr);
        });
    }

    function updatePagination({ currentPage: page, totalPages, limit, totalTransactions }) {
        startRange.textContent = ((page - 1) * limit) + 1;
        endRange.textContent = Math.min(page * limit, totalTransactions);
        totalItems.textContent = totalTransactions;

        prevPageBtn.disabled = page === 1;
        nextPageBtn.disabled = page === totalPages;

        // Update page numbers
        pageNumbers.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.className = `relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                i === page 
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`;
            button.textContent = i;
            button.onclick = () => {
                currentPage = i;
                fetchDocuments();
            };
            pageNumbers.appendChild(button);
        }
    }

    function showPreview(hash, data) {
        previewTitle.textContent = `Document Details`;
        
        // Format date safely
        const formattedDate = data.timeStamp ? formatDate(data.timeStamp) : 'N/A';
        
        previewContent.innerHTML = `
            <div class="space-y-6">
                <div class="bg-gray-50 p-6 rounded-lg">
                    <h4 class="font-medium text-gray-700 mb-4">Document Information</h4>
                    <dl class="grid grid-cols-2 gap-6">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Category</dt>
                            <dd class="mt-1 text-sm text-gray-900">${data.category || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Document Type</dt>
                            <dd class="mt-1 text-sm text-gray-900">${data.docType || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Upload Date</dt>
                            <dd class="mt-1 text-sm text-gray-900">${formattedDate}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Transaction</dt>
                            <dd class="mt-1 text-sm text-gray-900 font-mono">${hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : 'N/A'}</dd>
                        </div>
                        <div class="col-span-2">
                            <dt class="text-sm font-medium text-gray-500">IPFS Hash</dt>
                            <dd class="mt-1 text-sm text-gray-900 font-mono break-all">${data.fileCID || 'N/A'}</dd>
                        </div>
                    </dl>
                </div>

                <div class="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm text-blue-900">Your document is stored on IPFS and can be accessed through multiple gateways. Choose your preferred method below:</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="https://gateway.pinata.cloud/ipfs/${data.fileCID}" target="_blank" 
                       class="flex items-center justify-center px-4 py-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group">
                        <svg class="h-5 w-5 text-blue-500 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Download via Pinata</span>
                    </a>
                    <a href="https://ipfs.io/ipfs/${data.fileCID}" target="_blank"
                       class="flex items-center justify-center px-4 py-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group">
                        <svg class="h-5 w-5 text-blue-500 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">View on IPFS.io</span>
                    </a>
                </div>
            </div>
        `;

        if (data.fileCID) {
            viewOnIPFS.href = `https://gateway.pinata.cloud/ipfs/${data.fileCID}`;
        }
        if (hash) {
            viewOnEtherscan.href = `https://sepolia.etherscan.io/tx/${hash}`;
        }
        previewModal.classList.remove('hidden');
    }

    function getDocumentTypeName(category, type) {
        if (documentTypes[category]) {
            const entry = Object.entries(documentTypes[category]).find(([_, value]) => value === type);
            if (entry) {
                // Convert snake_case to Title Case
                return entry[0].split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            }
        }
        // Convert snake_case to Title Case if no match found
        return type.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp * 1000);
            if (isNaN(date.getTime())) return 'N/A';
            
            return new Intl.DateTimeFormat('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            }).format(date);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    }

    function showLoading() {
        loadingState.classList.remove('hidden');
        documentsTableBody.classList.add('hidden');
        emptyState.classList.add('hidden');
        paginationContainer.classList.add('hidden');
    }

    function hideLoading() {
        loadingState.classList.add('hidden');
        documentsTableBody.classList.remove('hidden');
    }

    function showEmpty() {
        emptyState.classList.remove('hidden');
        documentsTableBody.classList.add('hidden');
        paginationContainer.classList.add('hidden');
    }

    function hideEmpty() {
        emptyState.classList.add('hidden');
    }

    function showError() {
        // You can implement error state UI here
        hideLoading();
        documentsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-600">
                    Failed to load documents. Please try again later.
                </td>
            </tr>
        `;
    }

    // Expose the showPreview function globally
    window.showPreview = showPreview;
}); 