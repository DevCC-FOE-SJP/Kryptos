import React from 'react';
import { MeshProvider, useWallet } from '@meshsdk/react';
import SimpleIssueCertificate from './components/SimpleIssueCertificate';
import SimpleVerifyCertificate from './components/SimpleVerifyCertificate';
import StatusDisplay from './components/StatusDisplay';
import WalletDiagnostics from './components/WalletDiagnostics';
import CustomWalletConnect from './components/CustomWalletConnect';
import ConfigurationPanel from './components/ConfigurationPanel';

// Suppress React DOM warnings for SVG attributes from MeshSDK
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Invalid DOM property') ||
       args[0].includes('stroke-width') ||
       args[0].includes('stroke-linecap') ||
       args[0].includes('stroke-linejoin'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

function WalletStatus({ status }) {
  const { connected, wallet } = useWallet();

  const handleConnect = React.useCallback(async () => {
    console.log('handleConnect called.');
    try {
      if (wallet) {
        console.log('Wallet object before getChangeAddress:', wallet);
        const address = await wallet.getChangeAddress();
        console.log('Wallet address:', address);
        console.log('Wallet object after getChangeAddress:', wallet);
      } else {
        console.log('Wallet object is null or undefined.');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  }, [wallet]);

  React.useEffect(() => {
    if (connected) {
      handleConnect();
    }
  }, [connected, handleConnect]);

  React.useEffect(() => {
    // Check if Cardano is available in window
    console.log('Window.cardano:', window.cardano);
    if (window.cardano) {
      console.log('Available wallets:', Object.keys(window.cardano));
      if (window.cardano.lace) {
        console.log('Lace wallet found:', window.cardano.lace);
      }
    }
  }, []);

  return (
    <div className="mb-4">
      <p className={`text-sm ${status.connected ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
        Wallet Status: {status.connected ? '✅ Connected' : '❌ Not Connected'}
      </p>
      {status.connected && status.walletName && (
        <p className="text-xs text-gray-500 mt-1">
          Using: {status.walletName} Wallet
        </p>
      )}
      {status.error && (
        <p className="text-xs text-red-500 mt-1">
          Error: {status.error.message || status.error}
        </p>
      )}
    </div>
  );
}

function App() {
  console.log("App component rendering...");
  const [connectionStatus, setConnectionStatus] = React.useState({
    connected: false,
    error: null,
    walletName: null,
  });

  // State for status messages
  const [statusMessages, setStatusMessages] = React.useState([]);
  
  // State for configuration
  const [appConfig, setAppConfig] = React.useState({
    blockfrostApiKey: '',
    network: 'preprod',
    isValid: false
  });

  // Function to add status messages
  const addStatusMessage = (message, type = 'info', details = null) => {
    const newMessage = {
      id: Date.now(),
      message,
      type,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setStatusMessages(prev => [newMessage, ...prev.slice(0, 19)]); // Keep only last 20 messages
  };

  // Clear status messages
  const clearStatusMessages = () => {
    setStatusMessages([]);
  };

  // Handle configuration updates
  const handleConfigUpdate = (config, isValid) => {
    setAppConfig({
      ...config,
      isValid
    });
    
    // Update blockchain service configuration
    if (window.blockchainServiceConfig) {
      window.blockchainServiceConfig = config;
    } else {
      window.blockchainServiceConfig = config;
    }
  };

  return (
    <MeshProvider network={appConfig.network || "preprod"}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">CertiFy.</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Secure certificate issuance and verification on Cardano blockchain
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <WalletStatus status={connectionStatus} />
                <div className="flex gap-2 items-center">
                  <CustomWalletConnect 
                    onConnected={(walletInfo) => {
                      console.log('Custom wallet connected:', walletInfo);
                      setConnectionStatus({ 
                        connected: true, 
                        error: null, 
                        walletName: walletInfo.name,
                        walletApi: walletInfo.api,
                        address: walletInfo.address,
                        networkId: walletInfo.networkId
                      });
                      addStatusMessage(`Wallet connected: ${walletInfo.name} (${walletInfo.networkId === 0 ? 'Testnet' : 'Mainnet'})`, 'success');
                    }}
                    onDisconnected={() => {
                      console.log('Wallet disconnected!');
                      setConnectionStatus({ connected: false, error: null, walletName: null });
                      addStatusMessage('Wallet disconnected', 'info');
                    }}
                    onError={(error) => {
                      console.error('Wallet connection error:', error);
                      setConnectionStatus({ connected: false, error: error, walletName: null });
                      addStatusMessage(`Connection failed: ${error.message}`, 'error');
                    }}
                  />
                  {statusMessages.length > 0 && (
                    <button
                      onClick={clearStatusMessages}
                      className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg transition-colors"
                    >
                      Clear Log
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Configuration Panel */}
            <div className="mb-6">
              <ConfigurationPanel onConfigUpdate={handleConfigUpdate} />
            </div>
            
            {/* Wallet Diagnostics - Remove this in production */}
            <WalletDiagnostics />
            
            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Issue Certificate Section */}
              <SimpleIssueCertificate 
                onStatusUpdate={addStatusMessage} 
                walletApi={connectionStatus.walletApi}
                config={appConfig}
              />
              
              {/* Verify Certificate Section */}
              <SimpleVerifyCertificate 
                onStatusUpdate={addStatusMessage}
                walletAddress={connectionStatus.address}
                config={appConfig}
              />
            </div>
            
            {/* Status Display Section */}
            <StatusDisplay messages={statusMessages} />
            
            {/* Information Panel */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">How it works</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Issue Certificate:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Upload your PDF certificate file</li>
                    <li>Connect your Cardano wallet</li>
                    <li>Click "Issue" to store the file hash on blockchain</li>
                    <li>Transaction creates permanent proof of authenticity</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Verify Certificate:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Upload the certificate you want to verify</li>
                    <li>Connect your wallet to access blockchain</li>
                    <li>Click "Verify" to check against stored hashes</li>
                    <li>Get instant verification results</li>
                  </ol>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> This app uses Cardano's testnet for demonstration. 
                  Make sure your wallet is set to "Preview" or "Pre-production" testnet mode.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MeshProvider>
  );
}

export default App;