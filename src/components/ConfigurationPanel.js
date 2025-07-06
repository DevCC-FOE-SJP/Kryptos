import React, { useState, useEffect } from 'react';

const ConfigurationPanel = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState({
    network: localStorage.getItem('cardano_network') || 'preprod'
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update parent component
    onConfigUpdate && onConfigUpdate(config);
  }, [config, onConfigUpdate]);

  const handleConfigChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    // Save to localStorage
    localStorage.setItem('cardano_network', newConfig.network);
  };

  const getNetworkInfo = () => {
    switch (config.network) {
      case 'preprod':
        return { name: 'Pre-production Testnet', color: 'blue' };
      case 'preview':
        return { name: 'Preview Testnet', color: 'green' };
      case 'mainnet':
        return { name: 'Mainnet', color: 'red' };
      default:
        return { name: 'Unknown', color: 'gray' };
    }
  };

  const networkInfo = getNetworkInfo();

  return (
    <div className={`border rounded-lg backdrop-blur-sm bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20`}>
      <div 
        className="p-4 cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">
            ⚙️ Configuration
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded bg-${networkInfo.color}-500 bg-opacity-30 text-${networkInfo.color === 'red' ? 'red' : networkInfo.color === 'green' ? 'green' : 'blue'}-100 border border-${networkInfo.color === 'red' ? 'red' : networkInfo.color === 'green' ? 'green' : 'blue'}-200 border-opacity-30 backdrop-blur-sm`}>
            {networkInfo.name}
          </span>
          <svg 
            className={`w-5 h-5 transition-transform text-white ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white border-opacity-20">
          {/* Network Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Cardano Network
            </label>
            <select
              value={config.network}
              onChange={(e) => handleConfigChange('network', e.target.value)}
              className="w-full p-3 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-md focus:ring-2 focus:ring-white focus:ring-opacity-50 text-white"
            >
              <option value="preprod" className="bg-gray-800 text-white">Pre-production Testnet (Recommended)</option>
              <option value="preview" className="bg-gray-800 text-white">Preview Testnet</option>
              <option value="mainnet" className="bg-gray-800 text-white">Mainnet (Real ADA - BE CAREFUL!)</option>
            </select>
            <p className="text-xs text-blue-100 mt-1">
              Make sure your wallet is set to the same network!
            </p>
          </div>

          {/* Quick Setup Guide */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 rounded-md p-3">
            <h4 className="font-medium text-white mb-2">Quick Setup Steps:</h4>
            <ol className="text-xs text-blue-100 list-decimal list-inside space-y-1">
              <li>Go to <a href="https://blockfrost.io" target="_blank" rel="noopener noreferrer" className="underline text-white hover:text-blue-200">blockfrost.io</a> and sign up</li>
              <li>Create a new project and select "<strong>{networkInfo.name}</strong>"</li>
              <li>Make sure your wallet is on the same network</li>
              <li>Get test ADA from a <a href="https://docs.cardano.org/cardano-testnet/tools/faucet/" target="_blank" rel="noopener noreferrer" className="underline text-white hover:text-blue-200">testnet faucet</a></li>
            </ol>
          </div>
