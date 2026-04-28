// test/manual-test.ts
import * as dotenv from 'dotenv';
import { createAndUploadCheckpoint } from '../src/storage/checkpoint';
import { downloadCheckpoint } from '../src/storage/0g-client';
import { registerCheckpoint, getLatestCheckpoint } from '../src/storage/registry';

dotenv.config();

async function testStorage() {
  console.log('🧪 Testing 0G Storage Integration...\n');
  
  const testAgentId = 'test-agent-001';
  const testFilePath = './test-sample.txt';
  
  // Create a sample file to upload
  const fs = require('fs');
  fs.writeFileSync(testFilePath, 'Hello 0G Storage! This is a test checkpoint.');
  
  try {
    // 1. Upload to 0G Storage
    console.log('📤 Uploading to 0G Storage...');
    const rootHash = await createAndUploadCheckpoint('test-session');
    console.log(`✅ Upload successful! Root Hash: ${rootHash}\n`);
    
    // 2. Register on 0G Chain (if contract is deployed)
    if (process.env.REGISTRY_ADDRESS) {
      console.log('📝 Registering on 0G Chain...');
      const tx = await registerCheckpoint(testAgentId, rootHash);
      console.log(`✅ Registered! Tx: ${tx}\n`);
      
      // 3. Retrieve from chain
      console.log('🔍 Retrieving from 0G Chain...');
      const retrieved = await getLatestCheckpoint(testAgentId);
      console.log(`✅ Retrieved Root Hash: ${retrieved}\n`);
    }
    
    // 4. Download and verify
    console.log('📥 Downloading from 0G Storage...');
    const downloadPath = './test-download.txt';
    await downloadCheckpoint(rootHash, downloadPath);
    
    const downloaded = fs.readFileSync(downloadPath, 'utf8');
    console.log(`✅ Downloaded content: "${downloaded}"\n`);
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    if (fs.existsSync('./test-download.txt')) fs.unlinkSync('./test-download.txt');
  }
}

testStorage();