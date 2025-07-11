
import React, { useState } from 'react';
import blockchainService from '../services/blockchainService';

const CertificateAction = ({
  actionType,
  onStatusUpdate,
  walletApi,
  walletAddress,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const isConnected = !!walletApi;

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      blockchainService.validateFile(file);
      setSelectedFile(file);
      setVerificationResult(null);
      onStatusUpdate(`File selected: ${file.name}`, 'success');
    } catch (error) {
      onStatusUpdate(`File validation error: ${error.message}`, 'error');
      setSelectedFile(null);
    }
  };

  const handleAction = async () => {
    if (!isConnected) {
      onStatusUpdate('Please connect your wallet first', 'error');
      return;
    }

    if (!selectedFile) {
      onStatusUpdate('Please select a certificate file first', 'error');
      return;
    }

    setIsLoading(true);
    setVerificationResult(null);

    try {
      onStatusUpdate('Calculating file hash...', 'info');
      const fileHash = await blockchainService.calculateFileHash(selectedFile);

      if (actionType === 'issue') {
        onStatusUpdate('Creating blockchain transaction...', 'info');
        const txHash = await blockchainService.issueCertificate(
          fileHash,
          walletApi,
          selectedFile.name
        );

        onStatusUpdate(
          `Certificate issued successfully! Transaction: ${txHash}`,
          'success',
          { txHash }
        );
        setSelectedFile(null);
        document.getElementById('issue-file-input').value = '';
      } else if (actionType === 'verify') {
        onStatusUpdate('Getting wallet address...', 'info');

        let searchAddress = walletAddress;
        if (walletApi) {
          try {
            searchAddress = await blockchainService.getBech32Address(walletApi);
            console.log('Using bech32 address for search:', searchAddress);
          } catch (addressError) {
            console.warn(
              'Could not get bech32 address, using provided address:',
              addressError
            );
            searchAddress = walletAddress;
          }
        }

        onStatusUpdate('Searching blockchain for certificate...', 'info');
        const result = await blockchainService.verifyCertificate(
          fileHash,
          searchAddress
        );

        setVerificationResult(result);

        if (result.valid) {
          onStatusUpdate(
            `Certificate is VALID! Found on blockchain in transaction: ${result.transactionHash}`,
            'success'
          );
        } else {
          onStatusUpdate(
            'Certificate is INVALID - not found on blockchain',
            'error'
          );
        }
      }
    } catch (error) {
      console.error(`Error ${actionType}ing certificate:`, error);
      onStatusUpdate(
        `Failed to ${actionType} certificate: ${error.message}`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText =
    actionType === 'issue'
      ? 'Issue Certificate on Blockchain'
      : 'Verify Certificate';
  const buttonClass =
    actionType === 'issue'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-green-600 text-white hover:bg-green-700';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {actionType === 'issue'
          ? '📄 Issue Certificate'
          : '🔍 Verify Certificate'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Certificate File (PDF)
          </label>
          <input
            id={`${actionType}-file-input`}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {selectedFile && (
            <div className="mt-2 text-sm text-green-600">
              ✅ Selected: {selectedFile.name} (
              {blockchainService.formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>

        <button
          onClick={handleAction}
          disabled={!isConnected || !selectedFile || isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-all ${
            !isConnected || !selectedFile || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : buttonClass
          }`}
        >
          {isLoading
            ? actionType === 'issue'
              ? 'Processing...'
              : 'Verifying...'
            : buttonText}
        </button>

        {actionType === 'verify' && verificationResult && (
          <div
            className={`p-4 rounded-lg border ${
              verificationResult.valid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div
              className={`font-medium ${
                verificationResult.valid
                  ? 'text-green-800'
                  : 'text-red-800'
              }`}
            >
              {verificationResult.valid
                ? '✅ VALID Certificate'
                : '❌ INVALID Certificate'}
            </div>

            {verificationResult.valid && (
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <div>
                  <strong>Transaction:</strong>{' '}
                  <a
                    href={`https://preprod.cardanoscan.io/transaction/${verificationResult.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {verificationResult.transactionHash}
                  </a>
                </div>
                <div>
                  <strong>Issued:</strong> {verificationResult.issuedAt}
                </div>
                <div>
                  <strong>File:</strong> {verificationResult.fileName}
                </div>
                <div>
                  <strong>Issuer:</strong> {verificationResult.issuer}
                </div>
                <div className="text-xs bg-blue-100 text-blue-800 p-2 rounded mt-2">
                  &#x1F517;{' '}
                  <strong>Blockchain Verified:</strong> This certificate was
                  verified using real Cardano blockchain data.
                </div>
              </div>
            )}

            {!verificationResult.valid && (
              <div className="mt-1 text-sm text-red-700">
                This certificate was not found on the blockchain or has been
                tampered with.
              </div>
            )}
          </div>
        )}

        {!isConnected && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ Wallet not connected
          </div>
        )}
        
      </div>
    </div>
  );
};

export default CertificateAction;
