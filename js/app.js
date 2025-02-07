document.addEventListener('DOMContentLoaded', () => {
    const pinata = new PinataAPI();
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    const results = document.getElementById('results');
    const ipfsHash = document.getElementById('ipfsHash');
    const gatewayUrl = document.getElementById('gatewayUrl');
    const fileNameInput = document.getElementById('fileName');

    // Test authentication on load
    pinata.testAuthentication().then(isAuthenticated => {
        if (!isAuthenticated) {
            alert('Pinata authentication failed. Please check your credentials.');
        }
    });

    // Add new elements
    const selectedFileInfo = document.createElement('div');
    selectedFileInfo.className = 'mt-4 hidden';
    dropZone.insertAdjacentElement('afterend', selectedFileInfo);

    function updateSelectedFileInfo(file) {
        if (!file) {
            selectedFileInfo.classList.add('hidden');
            return;
        }

        const isImage = file.type.startsWith('image/');
        selectedFileInfo.innerHTML = `
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-4">
                    ${isImage ? `<img src="${URL.createObjectURL(file)}" class="w-16 h-16 object-cover rounded" />` : ''}
                    <div>
                        <p class="font-medium">${file.name}</p>
                        <p class="text-sm text-gray-500">${(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>
            </div>
        `;
        selectedFileInfo.classList.remove('hidden');
    }

    // Update file input handler
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        updateSelectedFileInfo(file);
    });

    // Update drop handler
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            updateSelectedFileInfo(files[0]);
        }
    });

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    // Upload handler
    uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file first');
            return;
        }

        try {
            uploadStatus.classList.remove('hidden');
            uploadBtn.disabled = true;
            results.classList.add('hidden');

            const customName = fileNameInput.value.trim();
            const result = await pinata.uploadFile(file, customName);

            ipfsHash.textContent = result.hash;
            gatewayUrl.href = result.gatewayUrl;
            gatewayUrl.textContent = result.gatewayUrl;
            
            results.classList.remove('hidden');
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            uploadStatus.classList.add('hidden');
            uploadBtn.disabled = false;
        }
    });
}); 