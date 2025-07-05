import React, { useState } from 'react';
import blockchainService from '../services/blockchainService';

const SimpleIssueCertificate = ({ onStatusUpdate, walletApi, config }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = !!walletApi;
  const isConfigured = config && config.isValid;

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      blockchainService.validateFile(file);
      setSelectedFile(file);
      onStatusUpdate(`File selected: ${file.name}`, 'success');
    } catch (error) {
      onStatusUpdate(`File validation error: ${error.message}`, 'error');
      setSelectedFile(null);
    }
  };

  const handleIssue = async () => {
    if (!isConnected) {
      onStatusUpdate('Please connect your wallet first', 'error');
      return;
    }

    if (!isConfigured) {
      onStatusUpdate('Please configure Blockfrost API key in the configuration panel', 'error');
      return;
    }

    if (!selectedFile) {
      onStatusUpdate('Please select a certificate file first', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      onStatusUpdate('Calculating file hash...', 'info');
      const fileHash = await blockchainService.calculateFileHash(selectedFile);
      
      onStatusUpdate('Creating blockchain transaction...', 'info');
      const txHash = await blockchainService.issueCertificate(
        fileHash, 
        walletApi, 
        selectedFile.name
      );

      onStatusUpdate(`Certificate issued successfully! Transaction: ${txHash}`, 'success');
      setSelectedFile(null);
      document.getElementById('issue-file-input').value = '';
    } catch (error) {
      console.error('Error issuing certificate:', error);
      onStatusUpdate(`Failed to issue certificate: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        📄 Issue Certificate
      </h2>

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Certificate File (PDF)
          </label>
          <input
            id="issue-file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {selectedFile && (
            <div className="mt-2 text-sm text-green-600">
              ✅ Selected: {selectedFile.name} ({blockchainService.formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>

        {/* Issue Button */}
        <button
          onClick={handleIssue}
          disabled={!isConnected || !isConfigured || !selectedFile || isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-all ${
            !isConnected || !isConfigured || !selectedFile || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Processing...' : 'Issue Certificate on Blockchain'}
        </button>

        {/* Status Messages */}
        {!isConnected && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ Wallet not connected
          </div>
        )}
        {!isConfigured && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ Blockfrost API key not configured
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleIssueCertificate;
