import { Transaction } from '@meshsdk/core';
import { Lucid, Blockfrost } from 'lucid-cardano';
import CryptoJS from 'crypto-js';

/* eslint-env es2020 */
/* global BigInt */

class BlockchainService {
  constructor() {
    this.defaultNetwork = 'preprod';
    
    // Clean up any legacy demo data on initialization
    this.cleanupDemoData();

    // Define ProxyBlockfrost as a class property that implements Lucid's Blockfrost interface
    // This class mimics the original Blockfrost class but routes through our proxy
    const self = this; // Store reference to this instance
    this.ProxyBlockfrost = class {
      constructor(baseUrl, projectId) {
        this.baseUrl = baseUrl || 'http://localhost:5001/api/blockfrost';
        this.projectId = projectId || 'proxy';
        this.url = 'https://cardano-preprod.blockfrost.io/api/v0'; // Lucid expects this
      }

      async request(endpoint, headers = {}, body) {
        // Use our proxy instead of direct Blockfrost calls
        const method = body ? 'post' : 'get';
        console.log(`ProxyBlockfrost: Making ${method} request to ${endpoint}`);
        const result = await self.makeBlockfrostRequest(endpoint, method, body);
        console.log(`ProxyBlockfrost: Result for ${endpoint}:`, result);
        return result;
      }

      async get(endpoint) {
        return await this.request(endpoint);
      }

      async post(endpoint, body) {
        return await this.request(endpoint, {}, body);
      }

      // This is the critical method that Lucid calls during initialization
      async getProtocolParameters() {
        try {
          const params = await this.get('/epochs/latest/parameters');
          
          console.log('Raw protocol parameters from Blockfrost:', params);
          
          // Let's inspect each field that might be undefined
          console.log('Critical field inspection:');
          console.log('- min_fee_a:', params.min_fee_a, typeof params.min_fee_a);
          console.log('- min_fee_b:', params.min_fee_b, typeof params.min_fee_b);
          console.log('- key_deposit:', params.key_deposit, typeof params.key_deposit);
          console.log('- pool_deposit:', params.pool_deposit, typeof params.pool_deposit);
          console.log('- min_utxo:', params.min_utxo, typeof params.min_utxo);
          console.log('- nonce:', params.nonce, typeof params.nonce);
          console.log('- cost_models:', params.cost_models, typeof params.cost_models);
          console.log('- cost_models_raw:', params.cost_models_raw, typeof params.cost_models_raw);
          
          // Instead of transforming, let's try returning exactly what Blockfrost gives us
          // but ensure no field is undefined by deep-cloning and checking
          const cleanParams = JSON.parse(JSON.stringify(params));
          
          // Replace any null values with empty string or zero
          const replaceNulls = (obj) => {
            for (const key in obj) {
              if (obj[key] === null) {
                if (typeof params[key] === 'string') {
                  obj[key] = '';
                } else if (typeof params[key] === 'number') {
                  obj[key] = 0;
                }
              } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                replaceNulls(obj[key]);
              }
            }
          };
          
          replaceNulls(cleanParams);
          
          console.log('Cleaned protocol parameters (nulls replaced):', cleanParams);
          
          // Additional validation - check if any critical fields are still undefined
          const criticalFields = ['min_fee_a', 'min_fee_b', 'key_deposit', 'pool_deposit', 'min_utxo'];
          for (const field of criticalFields) {
            if (cleanParams[field] === undefined || cleanParams[field] === null) {
              console.error(`CRITICAL: Field ${field} is still undefined/null:`, cleanParams[field]);
            }
          }
          
          return cleanParams;
        } catch (error) {
          console.error('Error in getProtocolParameters:', error);
          throw error;
        }
      }

      async getUtxos(address) {
        return await this.get(`/addresses/${address}/utxos`);
      }

      async getUtxosWithUnit(address, unit) {
        return await this.get(`/addresses/${address}/utxos/${unit}`);
      }

      async getTx(txHash) {
        return await this.get(`/txs/${txHash}`);
      }

      async getTxUtxos(txHash) {
        return await this.get(`/txs/${txHash}/utxos`);
      }

      async getAddressUtxos(address, page = 1, count = 100, order = 'asc') {
        return await this.get(`/addresses/${address}/utxos?page=${page}&count=${count}&order=${order}`);
      }

      async getDatum(datumHash) {
        return await this.get(`/scripts/datum/${datumHash}`);
      }

      async submitTx(tx) {
        const txData = typeof tx === 'string' ? tx : tx.to_hex ? tx.to_hex() : tx;
        return await self.makeBlockfrostRequest('/tx/submit', 'post', txData, null, 'application/cbor');
      }

      // Additional methods that Lucid might expect
      async getEpoch() {
        return await this.get('/epochs/latest');
      }

      async getSlot() {
        const epoch = await this.getEpoch();
        return epoch.start_time;
      }

      async getGenesis() {
        return await this.get('/genesis');
      }
    };
  }

  getConfig() {
    const network = localStorage.getItem('cardano_network') || this.defaultNetwork;
    const apiKey = null; // Not needed for proxy
    return {
      network: network,
      apiKey: apiKey,
      baseUrl: 'http://localhost:5001/api/blockfrost', // Proxy URL instead of Blockfrost URL
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

  async makeBlockfrostRequest(endpoint, method = 'get', body = null, params = null, contentType = 'application/json') {
    const backendUrl = 'http://localhost:5001/api/blockfrost'; // Your backend proxy URL

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint,
          method,
          body,
          params,
          contentType // Pass content type for specific cases like CBOR
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Backend proxy error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error from backend proxy:', error);
      throw new Error(error.message || 'Failed to communicate with backend proxy.');
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
        throw new Error('Wallet API not provided. Please connect your wallet.');
      }

      const serviceConfig = this.getConfig();
      
      console.log('Service config:', serviceConfig);
      
      // Initialize Lucid with Blockfrost
      let lucidNetwork;
      switch (serviceConfig.network) {
        case 'mainnet':
          lucidNetwork = 'Mainnet';
          break;
        case 'preview':
          lucidNetwork = 'Preview';
          break;
        case 'preprod':
        default:
          lucidNetwork = 'Preprod';
          break;
      }
      
      console.log('Service config network:', serviceConfig.network);
      console.log('Initializing Lucid with network:', lucidNetwork);

      let lucid;
      try {
        console.log('Initializing Lucid with direct Blockfrost (bypassing proxy for testing)...');
        console.log('Service config:', serviceConfig);
        console.log('Lucid network value:', lucidNetwork);
        
        // Validate that lucidNetwork is not undefined
        if (!lucidNetwork) {
          throw new Error('Lucid network is undefined. Check network configuration.');
        }
        
        // Try using the real Blockfrost class directly
        console.log('Creating real Blockfrost provider...');
        
        // Use environment variable for API key
        const apiKey = process.env.REACT_APP_BLOCKFROST_API_KEY || '';
        if (!apiKey) {
          throw new Error('Blockfrost API key not configured. Please set REACT_APP_BLOCKFROST_API_KEY environment variable.');
        }
        
        const blockfrost = new Blockfrost(
          'https://cardano-preprod.blockfrost.io/api/v0',
          apiKey
        );
        
        console.log('Real Blockfrost instance created:', blockfrost);

        console.log('About to call Lucid.new with real Blockfrost...');
        
        try {
          console.log('Calling Lucid.new...');
          lucid = await Lucid.new(blockfrost, lucidNetwork);
          console.log('Lucid.new completed successfully');
        } catch (lucidNewError) {
          console.error('Detailed error in Lucid.new:', lucidNewError);
          console.error('Error name:', lucidNewError.name);
          console.error('Error message:', lucidNewError.message);
          console.error('Error stack:', lucidNewError.stack);
          
          // Log the parameters we passed
          console.error('Blockfrost parameter:', blockfrost);
          console.error('Network parameter:', lucidNetwork);
          console.error('Network type:', typeof lucidNetwork);
          
          throw lucidNewError;
        }
        console.log('Lucid initialized successfully');
      } catch (lucidError) {
        console.error('Error initializing Lucid:', lucidError);
        console.error('Lucid error stack:', lucidError.stack);
        throw new Error(`Failed to initialize Lucid: ${lucidError.message}`);
      }

      // Create a wallet adapter for Lucid
      const walletAdapter = {
        getUtxos: () => walletApi.getUtxos(),
        getUsedAddresses: () => walletApi.getUsedAddresses(),
        getUnusedAddresses: () => walletApi.getUnusedAddresses(),
        getChangeAddress: () => walletApi.getChangeAddress(),
        getRewardAddresses: () => walletApi.getRewardAddresses(),
        signTx: (tx) => walletApi.signTx(tx, true),
        submitTx: (tx) => walletApi.submitTx(tx),
      };

      // Select wallet
      lucid.selectWallet(walletAdapter);

      // Get wallet address - convert to proper bech32 format
      let address;
      try {
        // Get the address from wallet in bech32 format using Lucid
        const hexAddress = await walletApi.getChangeAddress();
        console.log('Got hex address from wallet:', hexAddress);
        
        // Use Lucid to get proper bech32 address after selecting wallet
        address = await lucid.wallet.address();
        console.log('Using Lucid wallet address (bech32):', address);
      } catch (addressError) {
        console.error('Could not get bech32 address:', addressError);
        throw new Error('Failed to get wallet address in proper format');
      }

      // Validate address format
      if (!address) {
        throw new Error('Could not get wallet address. Please ensure your wallet is properly connected.');
      }

      if (typeof address !== 'string' || address.length < 10) {
        throw new Error(`Invalid address format received from wallet: ${address}`);
      }

      // Check wallet balance
      const utxos = await walletApi.getUtxos();
      if (!utxos || utxos.length === 0) {
        throw new Error('No UTXOs found in wallet. Please ensure your wallet has some test ADA.');
      }

      // Create simplified metadata with ASCII-only characters to avoid encoding issues
      const metadata = {
        hash: fileHash.substring(0, 32), // Truncate hash to avoid length issues
        file: fileName.replace(/[^\w\s.-]/g, "").substring(0, 20), // Remove special chars and truncate
        app: 'CertiFy'
      };

      console.log('Building transaction with simplified metadata:', metadata);

      // Build transaction with Lucid including metadata
      console.log('Building transaction with metadata...');
      const tx = await lucid
        .newTx()
        .payToAddress(address, { lovelace: BigInt(1500000) }) // Send 1.5 ADA to self
        .attachMetadata(674, metadata) // Attach the certificate metadata
        .complete();

      console.log('Transaction built, signing...');

      // Sign transaction
      const signedTx = await tx.sign().complete();
      
      console.log('Transaction signed, submitting...');

      // Submit transaction using Lucid's built-in submit method
      const txHash = await signedTx.submit();
      
      console.log('Transaction submitted with hash:', txHash);

      return txHash;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      
      // Provide specific error messages for common issues
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      
      if (errorMessage.includes('insufficient')) {
        throw new Error('Insufficient funds in wallet. Please ensure you have at least 3 ADA in your wallet.');
      } else if (errorMessage.includes('network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('API key')) {
        throw new Error('Blockfrost API configuration error. Please check your API key and network settings.');
      } else {
        throw new Error(`Failed to issue certificate: ${errorMessage}`);
      }
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

      // Check if address is hex format and try to convert it using real Blockfrost
      let searchAddress = walletAddress;
      if (walletAddress.length > 50 && !walletAddress.startsWith('addr')) {
        console.log('Address appears to be in hex format, attempting conversion...');
        
        // Initialize Lucid with real Blockfrost to use address utilities
        try {
          const serviceConfig = this.getConfig();
          const lucidNetwork = serviceConfig.network === 'mainnet' ? 'Mainnet' : 
                              serviceConfig.network === 'preview' ? 'Preview' : 'Preprod';
          
          // Use environment variable for API key
          const apiKey = process.env.REACT_APP_BLOCKFROST_API_KEY || '';
          if (!apiKey) {
            throw new Error('Blockfrost API key not configured');
          }
          
          const blockfrost = new Blockfrost(
            'https://cardano-preprod.blockfrost.io/api/v0',
            apiKey
          );
          
          const lucid = await Lucid.new(blockfrost, lucidNetwork);
          
          // Try to convert hex to bech32 using Lucid
          // For now, we'll use the hex address directly since conversion is complex
          searchAddress = walletAddress;
        } catch (conversionError) {
          console.warn('Could not convert address format:', conversionError);
          searchAddress = walletAddress;
        }
      }

      // Try to get transactions for the address using direct Blockfrost API
      let transactions;
      try {
        // Use environment variable for API key
        const apiKey = process.env.REACT_APP_BLOCKFROST_API_KEY || '';
        if (!apiKey) {
          return {
            valid: false,
            message: 'Blockfrost API key not configured. Please check your environment setup.'
          };
        }
        
        // Add a small delay to allow for blockchain indexing
        console.log('Waiting 2 seconds for potential blockchain indexing...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch(`https://cardano-preprod.blockfrost.io/api/v0/addresses/${searchAddress}/transactions?order=desc&count=100`, {
          headers: {
            'project_id': apiKey
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return {
              valid: false,
              message: 'Address not found on the blockchain. This could mean the address format is incorrect or no transactions have been made from this address.'
            };
          }
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        transactions = await response.json();
        console.log(`Found ${transactions.length} transactions for address`);
      } catch (apiError) {
        console.error('Direct API call failed:', apiError);
        return {
          valid: false,
          message: `Failed to query blockchain: ${apiError.message}. Please check the address format.`
        };
      }

      if (transactions.length === 0) {
        return {
          valid: false,
          message: 'No transactions found for this address. The certificate may have been issued from a different wallet or the address format may be incompatible.'
        };
      }

      // Check each transaction for matching metadata
      for (const tx of transactions) {
        try {
          // Use environment variable for API key
          const apiKey = process.env.REACT_APP_BLOCKFROST_API_KEY || '';
          if (!apiKey) {
            console.log(`No API key available for transaction ${tx.tx_hash}`);
            continue;
          }
          
          const metadataResponse = await fetch(`https://cardano-preprod.blockfrost.io/api/v0/txs/${tx.tx_hash}/metadata`, {
            headers: {
              'project_id': apiKey
            }
          });
          
          let metadata = null;
          if (metadataResponse.ok) {
            metadata = await metadataResponse.json();
            console.log(`Checking transaction ${tx.tx_hash} metadata:`, metadata);
            
            // Look for certificate metadata in label 674
            if (metadata && Array.isArray(metadata)) {
              const certMetadata = metadata.find(m => m.label === '674');
              if (certMetadata && certMetadata.json_metadata) {
                console.log('Found 674 metadata:', certMetadata.json_metadata);
                
                const metadataObj = certMetadata.json_metadata;
                
                // Check both new format (hash field) and old format (certificate_hash field)
                let hashToCheck = null;
                if (metadataObj.hash) {
                  hashToCheck = metadataObj.hash;
                  console.log('Found hash in new format:', hashToCheck);
                } else if (metadataObj.certificate_hash) {
                  hashToCheck = metadataObj.certificate_hash;
                  console.log('Found hash in old format:', hashToCheck);
                }
                
                if (hashToCheck) {
                  console.log('Searching for hash:', fileHash);
                  console.log('Hash in metadata:', hashToCheck);
                  
                  // Check both full hash and truncated hash
                  const truncatedInputHash = fileHash.substring(0, 32);
                  
                  // More comprehensive hash matching
                  const hashMatches = 
                    hashToCheck === fileHash ||                    // Exact full match
                    hashToCheck === truncatedInputHash ||          // Exact truncated match
                    fileHash.startsWith(hashToCheck) ||            // Full hash starts with stored hash
                    hashToCheck.startsWith(truncatedInputHash);    // Stored hash starts with truncated input
                  
                  console.log('Full input hash:', fileHash);
                  console.log('Truncated input hash:', truncatedInputHash);
                  console.log('Hash in metadata:', hashToCheck);
                  console.log('Hash matches:', hashMatches);
                  
                  if (hashMatches) {
                    // Extract additional metadata information with fallbacks
                    const fileName = metadataObj.file || metadataObj.filename || metadataObj.name || 'Unknown File';
                    const issuer = metadataObj.issuer || metadataObj.app || metadataObj.application || 'Unknown Issuer';
                    
                    // Format the issued date from block time
                    let issuedAt = 'Unknown';
                    if (tx.block_time) {
                      const date = new Date(tx.block_time * 1000); // Convert Unix timestamp to milliseconds
                      issuedAt = date.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short'
                      });
                    }
                    
                    console.log('Extracted metadata for display:');
                    console.log('- File Name:', fileName);
                    console.log('- Issuer:', issuer);
                    console.log('- Issued At:', issuedAt);
                    
                    return {
                      valid: true,
                      transactionHash: tx.tx_hash,
                      metadata: metadataObj,
                      blockTime: tx.block_time,
                      blockHeight: tx.block_height,
                      network: this.getConfig().network,
                      // Additional formatted fields for display
                      fileName: fileName,
                      issuer: issuer,
                      issuedAt: issuedAt
                    };
                  }
                }
              }
            }
          } else {
            console.log(`No metadata found for transaction ${tx.tx_hash}`);
          }
        } catch (metadataError) {
          console.log(`Error checking metadata for transaction ${tx.tx_hash}:`, metadataError);
          continue;
        }
      }

      return {
        valid: false,
        message: 'Certificate hash not found on blockchain. The certificate may be invalid or issued on a different network.'
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      
      // Provide specific error messages for common issues
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      
      if (errorMessage.includes('API key')) {
        throw new Error('Blockfrost API configuration error. Please check your API key and network settings.');
      } else if (errorMessage.includes('Invalid address format')) {
        throw new Error('Address format not supported by Blockfrost API. This may be a hex-encoded address that needs conversion to bech32 format.');
      } else if (errorMessage.includes('network') || errorMessage.includes('400')) {
        throw new Error('Network error or invalid address format. Please check your wallet connection and try again.');
      } else {
        throw new Error(`Failed to verify certificate: ${errorMessage}`);
      }
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

  /**
   * Clean up any demo data from localStorage
   * This function removes any legacy demo transaction data
   */
  cleanupDemoData() {
    try {
      localStorage.removeItem('demo_transactions');
      console.log('Demo data cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up demo data:', error);
    }
  }

  /**
   * Get network info from config
   * @returns {Object} - Network information
   */
  getNetworkInfo() {
    const config = this.getConfig();
    return {
      network: config.network,
      networkName: config.network === 'mainnet' ? 'Mainnet' : 
                   config.network === 'preview' ? 'Preview Testnet' : 
                   'Pre-production Testnet',
      apiUrl: config.baseUrl,
      isTestnet: config.network !== 'mainnet'
    };
  }

  /**
   * Validate Blockfrost API configuration
   * @returns {Promise<boolean>} - Whether the API key is valid
   */
  async validateApiKey() {
    try {
      // Test the API key by making a simple request via the proxy
      const response = await this.makeBlockfrostRequest('/network');
      return response.status === 200; // Assuming proxy returns status code or similar indication
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  /**
   * Test wallet connectivity and get basic info
   * @param {Object} walletApi - The wallet API instance
   * @returns {Promise<Object>} - Wallet information
   */
  async testWalletConnection(walletApi) {
    try {
      console.log('Testing wallet connection...');
      
      // Get basic wallet info
      const address = await walletApi.getChangeAddress();
      const usedAddresses = await walletApi.getUsedAddresses();
      const unusedAddresses = await walletApi.getUnusedAddresses();
      const utxos = await walletApi.getUtxos();
      
      const walletInfo = {
        changeAddress: address,
        usedAddressesCount: usedAddresses?.length || 0,
        unusedAddressesCount: unusedAddresses?.length || 0,
        utxosCount: utxos?.length || 0,
        totalAda: utxos?.reduce((sum, utxo) => {
          const amount = utxo.amount?.find(a => a.unit === 'lovelace');
          return sum + (parseInt(amount?.quantity || 0) / 1000000);
        }, 0) || 0
      };
      
      console.log('Wallet info:', walletInfo);
      return walletInfo;
    } catch (error) {
      console.error('Wallet connection test failed:', error);
      throw error;
    }
  }

  /**
   * Convert hex address to bech32 format for Blockfrost API
   * @param {string} hexAddress - The hex-encoded address
   * @returns {string} - The bech32-encoded address
   */
  hexToBech32Address(hexAddress) {
    try {
      // If it's already a bech32 address, return as is
      if (hexAddress.startsWith('addr') || hexAddress.startsWith('stake')) {
        return hexAddress;
      }
      
      // For hex addresses, we need to use Lucid's address utilities
      // This is a simplified conversion - in practice you'd use proper address conversion
      console.log('Converting hex address to bech32:', hexAddress);
      
      // For now, return the hex address and let the calling function handle the error
      // In a real implementation, you'd use Lucid's address conversion utilities
      return hexAddress;
    } catch (error) {
      console.error('Error converting address:', error);
      return hexAddress;
    }
  }

  /**
   * Get bech32 address from wallet using Lucid
   * @param {Object} walletApi - The wallet API instance
   * @returns {Promise<string>} - The bech32 address
   */
  async getBech32Address(walletApi) {
    try {
      // Initialize Lucid with real Blockfrost
      const serviceConfig = this.getConfig();
      const lucidNetwork = serviceConfig.network === 'mainnet' ? 'Mainnet' : 
                          serviceConfig.network === 'preview' ? 'Preview' : 'Preprod';
      
      // Use environment variable for API key
      const apiKey = process.env.REACT_APP_BLOCKFROST_API_KEY || '';
      if (!apiKey) {
        throw new Error('Blockfrost API key not configured');
      }
      
      const blockfrost = new Blockfrost(
        'https://cardano-preprod.blockfrost.io/api/v0',
        apiKey
      );
      
      const lucid = await Lucid.new(blockfrost, lucidNetwork);

      // Create wallet adapter
      const walletAdapter = {
        getUtxos: () => walletApi.getUtxos(),
        getUsedAddresses: () => walletApi.getUsedAddresses(),
        getUnusedAddresses: () => walletApi.getUnusedAddresses(),
        getChangeAddress: () => walletApi.getChangeAddress(),
        getRewardAddresses: () => walletApi.getRewardAddresses(),
        signTx: (tx) => walletApi.signTx(tx, true),
        submitTx: (tx) => walletApi.submitTx(tx),
      };

      // Select wallet
      lucid.selectWallet(walletAdapter);
      
      // Get the address in bech32 format
      const address = await lucid.wallet.address();
      console.log('Bech32 address from Lucid:', address);
      
      return address;
    } catch (error) {
      console.error('Error getting bech32 address:', error);
      // Fallback to wallet's address
      return await walletApi.getChangeAddress();
    }
  }

}

const blockchainService = new BlockchainService();
export default blockchainService;
