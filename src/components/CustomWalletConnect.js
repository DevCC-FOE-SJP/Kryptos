import React, { useState, useEffect } from 'react';

const CustomWalletConnect = ({ onConnected, onDisconnected, onError }) => {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);

  useEffect(() => {
    const checkWallets = () => {
      if (window.cardano) {
        const wallets = Object.keys(window.cardano).map(key => ({
          key,
          name: window.cardano[key]?.name || key,
          icon: window.cardano[key]?.icon || null,
          wallet: window.cardano[key]
        }));
        setAvailableWallets(wallets);
      }
    };

    checkWallets();
    // Recheck after a delay for wallets that inject later
    const timeout = setTimeout(checkWallets, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const connectWallet = async (walletKey) => {
    setIsConnecting(true);
    
    try {
      const walletApi = window.cardano[walletKey];
      
      if (!walletApi) {
        throw new Error(`${walletKey} wallet not found`);
      }

      console.log(`Attempting to connect to ${walletKey}...`);
      
      // Check if already enabled
      const isEnabled = await walletApi.isEnabled();
      
      let api;
      if (!isEnabled) {
        console.log(`Enabling ${walletKey} wallet...`);
        api = await walletApi.enable();
      } else {
        console.log(`${walletKey} already enabled, getting API...`);
        api = await walletApi.enable();
      }

      if (!api) {
        throw new Error('Failed to get wallet API');
      }

      console.log(`${walletKey} wallet connected successfully:`, api);

      // Test the API
      const networkId = await api.getNetworkId();
      const addresses = await api.getUsedAddresses();
      const changeAddress = await api.getChangeAddress();

      console.log('Wallet details:', {
        networkId,
        addresses: addresses.length,
        changeAddress
      });

      const walletInfo = {
        name: walletApi.name || walletKey,
        api,
        networkId,
        address: changeAddress
      };

      setConnectedWallet(walletInfo);
      onConnected && onConnected(walletInfo);

    } catch (error) {
      console.error(`Error connecting to ${walletKey}:`, error);
      onError && onError(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    onDisconnected && onDisconnected();
  };

  if (connectedWallet) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm">
          <div className="text-green-600 font-medium">✅ Connected to {connectedWallet.name}</div>
          <div className="text-xs text-gray-500">
            Network: {connectedWallet.networkId === 0 ? 'Testnet' : 'Mainnet'}
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (availableWallets.length === 0) {
    return (
      <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 font-medium">No Cardano wallets detected</p>
        <p className="text-yellow-700 text-sm mt-1">
          Please install a Cardano wallet extension like{' '}
          <a href="https://www.lace.io/" target="_blank" rel="noopener noreferrer" className="underline">
            Lace
          </a>
          {' or '}
          <a href="https://namiwallet.io/" target="_blank" rel="noopener noreferrer" className="underline">
            Nami
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">Choose a wallet to connect:</div>
      <div className="grid gap-2">
        {availableWallets.map(wallet => (
          <button
            key={wallet.key}
            onClick={() => connectWallet(wallet.key)}
            disabled={isConnecting}
            className={`
              flex items-center gap-3 p-3 border rounded-lg text-left transition-all
              ${isConnecting 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200'
              }
            `}
          >
            {wallet.icon && (
              <img src={wallet.icon} alt={wallet.name} className="w-6 h-6" />
            )}
            <div>
              <div className="font-medium">{wallet.name}</div>
              <div className="text-xs text-gray-500 capitalize">{wallet.key}</div>
            </div>
            {isConnecting && (
              <div className="ml-auto">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomWalletConnect;
