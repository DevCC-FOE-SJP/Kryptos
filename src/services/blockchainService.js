import { Transaction } from '@meshsdk/core';
import CryptoJS from 'crypto-js';

class BlockchainService {
  constructor() {
    this.defaultNetwork = 'preprod';
  }

  // Get current configuration from global state or use defaults
  getConfig() {
    const config = window.blockchainServiceConfig || {};
    return {
      apiKey: config.blockfrostApiKey || process.env.REACT_APP_BLOCKFROST_API_KEY || 'preprodYOUR_API_KEY_HERE',
      network: config.network || this.defaultNetwork,
      baseUrl: this.getBaseUrl(config.network || this.defaultNetwork)
    };
  }

  getBaseUrl(network) {
    switch (network) {
      case 'mainnet':
        return 'https://cardano-mainnet.blockfrost.io/api/v0';
      case 'preview':
        return 'https://cardano-preview.blockfrost.io/api/v0';
      case 'preprod':
      default:
        return 'https://cardano-preprod.blockfrost.io/api/v0';
    }
  }

  /**
   * Calculate SHA-256 hash of a file
   * @param {File} file - The file to hash
   * @returns {Promise<string>} - The hex hash string
   */
  async calculateFileHash(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target.result;
          const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
          const hash = CryptoJS.SHA256(wordArray).toString();
          resolve(hash);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Issue a certificate by storing its hash on the blockchain
   * @param {string} fileHash - The hash of the certificate file
   * @param {Object} walletApi - The connected wallet API instance
   * @param {string} fileName - The original filename
   * @returns {Promise<string>} - The transaction hash
   */
  async issueCertificate(fileHash, walletApi, fileName = 'certificate.pdf') {
    try {
      console.log('Issuing certificate with hash:', fileHash);
      console.log('Wallet API:', walletApi);
      
      if (!walletApi) {
        throw new Error('Wallet API not provided');
      }

      // Get wallet address and UTXOs
      const changeAddress = await walletApi.getChangeAddress();
      const utxos = await walletApi.getUtxos();
      
      console.log('Using address:', changeAddress);
      console.log('Available UTXOs:', utxos.length);

      if (!utxos || utxos.length === 0) {
        throw new Error('No UTXOs available. Make sure your wallet has some ADA.');
      }

      // Create metadata
      const metadata = {
        674: {
          certificate_hash: fileHash,
          file_name: fileName,
          issued_at: new Date().toISOString(),
          issuer: 'Certificate Verifier App',
          version: '1.0'
        }
      };

      // Build transaction using wallet's built-in methods
      console.log('Building transaction with metadata:', metadata);
      
      // Use the wallet's transaction building capabilities
      const txBuilder = await this.buildTransactionWithMetadata(
        walletApi, 
        changeAddress, 
        utxos, 
        metadata
      );

      return txBuilder;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw new Error(`Failed to issue certificate: ${error.message}`);
    }
  }

  /**
   * Build a transaction with metadata using the wallet API
   * @param {Object} walletApi - Wallet API instance
   * @param {string} address - Wallet address
   * @param {Array} utxos - Available UTXOs
   * @param {Object} metadata - Transaction metadata
   * @returns {Promise<string>} - Transaction hash
   */
  async buildTransactionWithMetadata(walletApi, address, utxos, metadata) {
    try {
      // For now, let's try a simpler approach using the wallet's native transaction building
      // This varies by wallet, but most support building transactions with metadata
      
      // Create a simple transaction that sends 2 ADA to self with metadata
      const outputs = [{
        address: address,
        amount: {
          lovelace: '2000000' // 2 ADA in lovelace
        }
      }];

      // Try to build transaction with metadata
      // Note: This is a simplified approach - in production you'd want more robust transaction building
      const txHash = await this.submitSimpleTransaction(walletApi, outputs, metadata);
      
      return txHash;
    } catch (error) {
      console.error('Error building transaction:', error);
      throw new Error(`Transaction building failed: ${error.message}`);
    }
  }

  /**
   * Submit a simple transaction with metadata
   * @param {Object} walletApi - Wallet API instance
   * @param {Array} outputs - Transaction outputs
   * @param {Object} metadata - Transaction metadata
   * @returns {Promise<string>} - Transaction hash
   */
  async submitSimpleTransaction(walletApi, outputs, metadata) {
    try {
      // This is a placeholder for proper transaction building
      // In a real implementation, you'd use a library like CardanoWasm or Lucid
      // For now, let's simulate the transaction submission
      
      console.log('Simulating transaction submission...');
      console.log('Outputs:', outputs);
      console.log('Metadata:', metadata);
      
      // Simulate a successful transaction
      const simulatedTxHash = 'simulated_tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store the transaction details locally for verification demo
      const transactionRecord = {
        txHash: simulatedTxHash,
        metadata: metadata,
        timestamp: new Date().toISOString(),
        outputs: outputs
      };
      
      // Store in localStorage for demo purposes
      const existingTxs = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
      existingTxs.push(transactionRecord);
      localStorage.setItem('demo_transactions', JSON.stringify(existingTxs));
      
      console.log('Demo transaction created:', simulatedTxHash);
      
      return simulatedTxHash;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw new Error(`Transaction submission failed: ${error.message}`);
    }
  }

  /**
   * Verify a certificate by checking if its hash exists on the blockchain
   * @param {string} fileHash - The hash to search for
   * @param {string} walletAddress - The wallet address to search transactions for
   * @returns {Promise<Object>} - Verification result with details
   */
  async verifyCertificate(fileHash, walletAddress) {
    try {
      console.log('Verifying certificate with hash:', fileHash);
      console.log('Searching address:', walletAddress);

      // First check local demo transactions
      const demoResult = await this.verifyFromDemoTransactions(fileHash);
      if (demoResult.valid) {
        return demoResult;
      }

      // If not found in demo transactions and we have a valid API key, check blockchain
      const config = this.getConfig();
      if (config.apiKey && config.apiKey !== 'preprodYOUR_API_KEY_HERE') {
        // Get transactions for the address
        const transactions = await this.getAddressTransactions(walletAddress);
        console.log(`Found ${transactions.length} transactions to check`);

        // Check each transaction for matching metadata
        for (const tx of transactions) {
          try {
            const metadata = await this.getTransactionMetadata(tx.tx_hash);
            console.log(`Checking transaction ${tx.tx_hash} metadata:`, metadata);
            
            // Look for certificate metadata in label 674
            if (metadata && metadata['674'] && metadata['674'].certificate_hash === fileHash) {
              return {
                valid: true,
                transactionHash: tx.tx_hash,
                issuedAt: metadata['674'].issued_at,
                fileName: metadata['674'].file_name,
                issuer: metadata['674'].issuer,
                blockTime: tx.block_time
              };
            }
          } catch (metadataError) {
            console.log(`No metadata found for transaction ${tx.tx_hash}`);
            continue;
          }
        }
      }

      return {
        valid: false,
        message: 'Certificate hash not found on blockchain or in demo transactions'
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw new Error(`Failed to verify certificate: ${error.message}`);
    }
  }

  /**
   * Verify certificate from local demo transactions
   * @param {string} fileHash - The hash to search for
   * @returns {Promise<Object>} - Verification result
   */
  async verifyFromDemoTransactions(fileHash) {
    try {
      const demoTxs = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
      console.log('Checking demo transactions:', demoTxs.length);

      for (const tx of demoTxs) {
        if (tx.metadata && tx.metadata['674'] && tx.metadata['674'].certificate_hash === fileHash) {
          return {
            valid: true,
            transactionHash: tx.txHash,
            issuedAt: tx.metadata['674'].issued_at,
            fileName: tx.metadata['674'].file_name,
            issuer: tx.metadata['674'].issuer,
            blockTime: tx.timestamp,
            isDemo: true
          };
        }
      }

      return { valid: false };
    } catch (error) {
      console.error('Error checking demo transactions:', error);
      return { valid: false };
    }
  }

  /**
   * Get transactions for a given address using Blockfrost API
   * @param {string} address - The wallet address
   * @returns {Promise<Array>} - Array of transactions
   */
  async getAddressTransactions(address) {
    try {
      const config = this.getConfig();
      
      if (!config.apiKey || config.apiKey === 'preprodYOUR_API_KEY_HERE') {
        throw new Error('Blockfrost API key not configured. Please set up your API key in the configuration panel.');
      }

      const response = await fetch(`${config.baseUrl}/addresses/${address}/transactions?order=desc&count=50`, {
        headers: {
          'project_id': config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Blockfrost API error: ${response.status} ${response.statusText}`);
      }

      const transactions = await response.json();
      console.log('Fetched transactions from Blockfrost:', transactions);
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Get metadata for a specific transaction
   * @param {string} txHash - The transaction hash
   * @returns {Promise<Object>} - Transaction metadata
   */
  async getTransactionMetadata(txHash) {
    try {
      const config = this.getConfig();
      
      const response = await fetch(`${config.baseUrl}/txs/${txHash}/metadata`, {
        headers: {
          'project_id': config.apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No metadata found
        }
        throw new Error(`Blockfrost API error: ${response.status} ${response.statusText}`);
      }

      const metadataArray = await response.json();
      console.log('Raw metadata from Blockfrost:', metadataArray);
      
      // Convert array format to object format
      const metadata = {};
      metadataArray.forEach(item => {
        metadata[item.label] = item.json_metadata;
      });
      
      return metadata;
    } catch (error) {
      console.error('Error fetching transaction metadata:', error);
      return null;
    }
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file type (only PDF for now)
   * @param {File} file - The file to validate
   * @returns {boolean} - Whether file is valid
   */
  validateFile(file) {
    const allowedTypes = ['application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF files are supported');
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    return true;
  }
}

const blockchainService = new BlockchainService();
export default blockchainService;
