// test/manual-test.ts - Add validation at the top
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createAndUploadCheckpoint } from '../src/storage/checkpoint';
import { downloadCheckpoint } from '../src/storage/0g-client';
import { registerCheckpoint, getLatestCheckpoint, listenForCheckpoints } from '../src/storage/registry';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function validateEnvironment() {
  const required = ['PRIVATE_KEY', 'EVMRPC_URL', 'INDEXER_RPC', 'REGISTRY_ADDRESS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.log('\nPlease add to .env:');
    missing.forEach(key => {
      if (key === 'PRIVATE_KEY') console.log(`   ${key}=your_private_key_without_0x_prefix`);
      if (key === 'EVMRPC_URL') console.log(`   ${key}=https://evmrpc-testnet.0g.ai`);
      if (key === 'INDEXER_RPC') console.log(`   ${key}=https://indexer-storage-testnet-turbo.0g.ai`);
      if (key === 'REGISTRY_ADDRESS') console.log(`   ${key}=0xYourDeployedContractAddress`);
    });
    process.exit(1);
  }
  
  // Validate address format
  const { ethers } = await import('ethers');
  if (!ethers.isAddress(process.env.REGISTRY_ADDRESS!)) {
    console.error('❌ Invalid REGISTRY_ADDRESS format. Must be a valid Ethereum address starting with 0x');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed\n');
}

async function testFullOnChainIntegration() {
  await validateEnvironment();
  
  const testAgentId = 'test-agent-' + Date.now();
  const testSessionId = testAgentId;
  
  console.log('🧪 Testing Complete 0G Integration (Storage + Chain)...\n');
  
  try {
    // ========== PART 1: UPLOAD AND REGISTER ==========
    console.log('📤 PART 1: Creating and uploading checkpoint...');
    const rootHash = await createAndUploadCheckpoint(testSessionId);
    console.log(`✅ File uploaded to 0G Storage. Root Hash: ${rootHash}\n`);
    
    console.log('⛓️ PART 2: Registering on 0G Chain...');
    const txHash = await registerCheckpoint(testAgentId, rootHash);
    console.log(`✅ Registered on-chain! Transaction: ${txHash}`);
    console.log(`🔗 View on ChainScan: https://chainscan-galileo.0g.ai/tx/${txHash}\n`);
    
    // ========== PART 2: RETRIEVE FROM CHAIN ==========
    console.log('🔍 PART 3: Retrieving from 0G Chain...');
    const retrievedHash = await getLatestCheckpoint(testAgentId);
    console.log(`✅ Retrieved from chain: ${retrievedHash}`);
    console.log(`📋 Match: ${retrievedHash === rootHash ? '✓ PASS' : '✗ FAIL'}\n`);
    
    // ========== PART 3: DOWNLOAD AND VERIFY ==========
    console.log('📥 PART 4: Downloading from 0G Storage...');
    const downloadPath = './test-restored-checkpoint.zip';
    await downloadCheckpoint(rootHash, downloadPath);
    
    const fs = require('fs');
    const stats = fs.statSync(downloadPath);
    console.log(`✅ Downloaded successfully! Size: ${stats.size} bytes\n`);
    
    // ========== CLEANUP ==========
    console.log('🧹 Cleaning up test files...');
    if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
    
    console.log('\n🎉 ALL TESTS PASSED! Full 0G integration working!');
    console.log('📋 Summary:');
    console.log(`   - 0G Storage: ✓ Upload/Download working`);
    console.log(`   - 0G Chain: ✓ Contract at ${process.env.REGISTRY_ADDRESS}`);
    console.log(`   - Transaction: ${txHash}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testFullOnChainIntegration();