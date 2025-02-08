// Elements
const walletDisplay = document.getElementById('walletDisplay');
const walletStatus = document.getElementById('walletStatus');
const walletAddress = document.getElementById('walletAddress');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Check if MetaMask is installed and get initial state
async function checkMetaMask() {
    if (typeof window.ethereum !== "undefined") {
        console.log("MetaMask is installed!");
        try {
            // Check if we're already connected
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts.length > 0) {
                // We have an active connection, update the UI
                updateWalletDisplay(accounts[0]);
            } else {
                // No active connection, show connect state
                showDisconnectedState();
            }
        } catch (error) {
            console.error('Error checking MetaMask connection:', error);
            showDisconnectedState();
        }
    } else {
        console.log("MetaMask is not installed.");
        showMetaMaskNotInstalledState();
    }
}

// Show toast message
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Clear any existing timeouts
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }
    
    toastMessage.textContent = message;
    
    // Show toast
    toast.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
    
    // Set timeout to hide the toast
    window.toastTimeout = setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
    }, duration);
}

// Show disconnected state
function showDisconnectedState() {
    walletStatus.textContent = "Connect Wallet";
    walletAddress.textContent = "Not Connected";
    walletDisplay.classList.remove('bg-blue-50');
    walletDisplay.classList.add('bg-red-50');
    
    // Update the tooltip text
    const walletActionText = document.getElementById('walletActionText');
    if (walletActionText) {
        walletActionText.textContent = 'connect';
    }
    
    window.userWalletAddress = null;
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
}

// Show MetaMask not installed state
function showMetaMaskNotInstalledState() {
    walletStatus.textContent = "MetaMask Not Installed";
    walletAddress.textContent = "Not Available";
    walletDisplay.classList.remove('bg-blue-50');
    walletDisplay.classList.add('bg-red-50');
}

// Connect to MetaMask
async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
        try {
            // Always request new connection to trigger MetaMask popup
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            });
            
            if (accounts.length > 0) {
                updateWalletDisplay(accounts[0]);
            }
        } catch (error) {
            console.error(error);
            // If user rejected the connection, ensure we're in disconnected state
            if (error.code === 4001) {
                showDisconnectedState();
            }
        }
    } else {
        alert("Please install MetaMask to use this feature.");
    }
}

// Update wallet display
function updateWalletDisplay(account) {
    walletStatus.textContent = "Connected Wallet";
    walletAddress.textContent = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    walletDisplay.classList.remove('bg-red-50');
    walletDisplay.classList.add('bg-blue-50');
    
    // Update the tooltip text
    const walletActionText = document.getElementById('walletActionText');
    if (walletActionText) {
        walletActionText.textContent = 'disconnect';
    }
    
    // Store the full address for other components to use
    window.userWalletAddress = account;
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('walletConnected', { 
        detail: { address: account } 
    }));
}

// Handle wallet click
function handleWalletClick() {
    if (walletAddress.textContent === "Not Connected") {
        connectWallet();
    } else {
        showToast("Please disconnect your wallet through MetaMask");
    }
}

// Replace the existing click event with the new handler
if (walletDisplay) {
    walletDisplay.onclick = handleWalletClick;
}

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length > 0) {
            updateWalletDisplay(accounts[0]);
        } else {
            // If user disconnected through MetaMask
            showDisconnectedState();
        }
    });

    // Handle chain changes
    window.ethereum.on('chainChanged', function () {
        // Refresh the page on chain change
        window.location.reload();
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', checkMetaMask); 