// test/verify-contract.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyContract() {
  // Validate environment variables
  const EVMRPC_URL = process.env.EVMRPC_URL;
  const contractAddress = process.env.REGISTRY_ADDRESS;

  if (!EVMRPC_URL) {
    console.error('❌ Missing EVMRPC_URL in .env file');
    console.log('   Please add: EVMRPC_URL=https://evmrpc-testnet.0g.ai');
    process.exit(1);
  }

  if (!contractAddress) {
    console.error('❌ Missing REGISTRY_ADDRESS in .env file');
    console.log('   Please add: REGISTRY_ADDRESS=0xYourDeployedContractAddress');
    process.exit(1);
  }

  // Validate address format
  if (!ethers.isAddress(contractAddress)) {
    console.error(`❌ Invalid contract address format: ${contractAddress}`);
    console.log('   Address should start with 0x and be 42 characters long');
    process.exit(1);
  }

  console.log(`🔍 Verifying contract at ${contractAddress}...`);
  console.log(`🌐 Connected to: ${EVMRPC_URL}\n`);

  try {
    const provider = new ethers.JsonRpcProvider(EVMRPC_URL);
    
    // Check if contract has bytecode (exists)
    const code = await provider.getCode(contractAddress);
    
    if (code === '0x') {
      console.error('❌ No contract found at this address!');
      console.log('   Possible reasons:');
      console.log('   - Contract not deployed yet');
      console.log('   - Wrong network (make sure you\'re on Galileo testnet)');
      console.log('   - Wrong address');
      process.exit(1);
    }
    
    console.log('✅ Contract exists on chain!');
    console.log(`   Bytecode size: ${(code.length - 2) / 2} bytes\n`);
    
    // Try to interact with the contract
    const contract = new ethers.Contract(contractAddress, [
      "function getLatestCheckpoint(string memory) view returns (string)"
    ], provider);
    
    try {
      const result = await contract.getLatestCheckpoint("test");
      console.log('✅ Contract is responsive!');
      console.log(`   Test query result: "${result}" (empty means no checkpoints yet)`);
    } catch (callError: any) {
      console.log('⚠️ Contract exists but getLatestCheckpoint call failed:');
      console.log(`   ${callError.message}`);
      console.log('   This is normal if the contract is newly deployed with no data.');
    }
    
    // Get chain info
    const chainId = (await provider.getNetwork()).chainId;
    const blockNumber = await provider.getBlockNumber();
    
    console.log('\n📊 Network Info:');
    console.log(`   Chain ID: ${chainId} ${chainId === 16602n ? '(0G Galileo Testnet ✓)' : '(⚠️ Wrong network)'}`);
    console.log(`   Latest Block: ${blockNumber}`);
    
    console.log('\n🎉 Contract verification complete! Ready to use with 0G-Memory-Hooks.');
    
  } catch (error: any) {
    console.error('❌ Failed to verify contract:', error.message);
    if (error.code === 'NETWORK_ERROR') {
      console.log('\n💡 Network troubleshooting:');
      console.log('   - Check your internet connection');
      console.log('   - Verify EVMRPC_URL is correct');
      console.log('   - Try ping evmrpc-testnet.0g.ai');
    }
    process.exit(1);
  }
}

// Run the verification
verifyContract();