import { Lucid, Blockfrost } from 'lucid-cardano';

// Simple test to check Lucid initialization
async function testLucid() {
  try {
    console.log('Testing Lucid initialization...');
    
    // Test 1: Try with a simple blockfrost instance
    const blockfrost = new Blockfrost(
      'https://cardano-preprod.blockfrost.io/api/v0',
      'test_key'
    );
    
    console.log('Blockfrost instance created:', blockfrost);
    
    // Test 2: Try Lucid.new with minimal setup
    const lucid = await Lucid.new(blockfrost, 'Preprod');
    console.log('Lucid initialized successfully:', lucid);
    
  } catch (error) {
    console.error('Lucid initialization failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Export for testing
export { testLucid };
