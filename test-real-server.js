const { DaptinClient } = require('./dist/main');
const fs = require('fs');
const path = require('path');

// Create a test file to upload
const testContent = 'This is a test file uploaded at ' + new Date().toISOString();
const testFileName = 'test-upload-' + Date.now() + '.txt';
const testFilePath = path.join(__dirname, testFileName);
fs.writeFileSync(testFilePath, testContent);

// Custom token getter for Node.js
class NodeTokenGetter {
    constructor() {
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    getToken() {
        return this.token;
    }
}

async function testRealServer() {
    console.log('Testing against real Daptin server at localhost:6336\n');
    console.log('=' .repeat(50));

    const tokenGetter = new NodeTokenGetter();
    const client = new DaptinClient('http://localhost:6336', false, tokenGetter);

    try {
        // Step 1: Authenticate
        console.log('\n1. Authenticating...');
        const authResponse = await client.actionManager.doAction('user_account', 'signin', {
            email: 'artpar@gmail.com',
            password: 'parth123'
        });

        console.log('   Auth response:', JSON.stringify(authResponse, null, 2));

        // Check different possible response formats
        let token = null;
        if (authResponse) {
            // Check for direct token
            if (authResponse.AuthToken) {
                token = authResponse.AuthToken;
            }
            // Check in array response
            else if (Array.isArray(authResponse) && authResponse.length > 0) {
                for (const resp of authResponse) {
                    // Look for client.store.set with token
                    if (resp.ResponseType === 'client.store.set' &&
                        resp.Attributes &&
                        resp.Attributes.key === 'token' &&
                        resp.Attributes.value) {
                        token = resp.Attributes.value;
                        break;
                    }
                    if (resp.Attributes && resp.Attributes.token) {
                        token = resp.Attributes.token;
                        break;
                    }
                    if (resp.Attributes && resp.Attributes.AuthToken) {
                        token = resp.Attributes.AuthToken;
                        break;
                    }
                }
            }
            // Check for Attributes.token
            else if (authResponse.Attributes && authResponse.Attributes.token) {
                token = authResponse.Attributes.token;
            }
        }

        if (token) {
            tokenGetter.setToken(token);
            console.log('   ✓ Authentication successful');
            console.log('   Token received:', token.substring(0, 20) + '...');
        } else {
            throw new Error('Authentication failed - no token received in response');
        }

        // Step 2: Load models first
        console.log('\n2. Loading models...');
        await client.worldManager.loadModels(false);

        // Step 3: Get world list to find a suitable table
        console.log('\n3. Getting available tables...');
        const worlds = client.worldManager.getWorlds();
        const worldArray = Object.values(worlds);
        console.log('   Found', worldArray.length, 'tables');

        // Find user_account table or first available table
        let targetTable = worlds['memory'];
        console.log('   Using table:', targetTable.table_name);

        // Step 4: Create a test record if needed
        console.log('\n4. Creating or getting a test record...');
        let testRecord;

        try {
            // Try to get existing records
            const records = await client.jsonApi.findAll(targetTable.table_name, {
                page: { size: 1 }
            });

            if (records && records.data && records.data.length > 0) {
                testRecord = records.data[0];
                console.log('   Using existing record ID:', testRecord.id);
            }
        } catch (e) {
            console.log('   Could not fetch existing records:', e.message);
        }

        // If no record exists, try to create one
        if (!testRecord) {
            try {
                testRecord = await client.jsonApi.create(targetTable.table_name, {
                    name: 'Test Asset Upload ' + Date.now()
                });
                console.log('   Created new record ID:', testRecord.id);
            } catch (e) {
                console.log('   Could not create record:', e.message);
                // Use a dummy ID
                testRecord = { id: '1' };
                console.log('   Using dummy record ID:', testRecord.id);
            }
        }


        // Step 6: Test file upload
        console.log('\n6. Testing file upload...');

        // Read file as Buffer for Node.js
        const fileBuffer = fs.readFileSync(testFilePath);
        const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
        fileBlob.name = testFileName;
        // Step 5: Test asset URL generation
        console.log('\n5. Testing asset URL generation...');
        const assetUrl = client.assetManager.getAssetUrl(
            targetTable.table_name,
            testRecord.id,
            'artifacts',
            testFileName

        );
        console.log('   Asset URL:', assetUrl);

        console.log('   File name:', testFileName);
        console.log('   File size:', fileBuffer.length, 'bytes');

        try {
            await client.assetManager.uploadFile(
                targetTable.table_name,
                testRecord.id,
                'artifacts',
                fileBlob,
                testFileName,
                {
                    onProgress: (progress) => {
                        console.log(`   Upload progress: ${progress.percent.toFixed(0)}%`);
                    }
                }
            );
            console.log('   ✓ File upload completed successfully!');

            // Generate download URL
            const downloadUrl = client.assetManager.getAssetUrl(
                targetTable.table_name,
                testRecord.id,
                'artifacts'
            );
            console.log('   Download URL:', downloadUrl);

        } catch (uploadError) {
            console.log('   ✗ Upload failed:', uploadError.message);
            if (uploadError.response) {
                console.log('   Response status:', uploadError.response.status);
                console.log('   Response data:', uploadError.response.data);
            }
        }

        // Step 7: Test resumable upload session
        console.log('\n7. Testing resumable upload session...');
        try {
            const sessionId = await client.assetManager.createResumableUpload(
                targetTable.table_name,
                testRecord.id,
                'artifacts',
                'large-file.dat',
                10485760, // 10MB
                'application/octet-stream'
            );
            console.log('   ✓ Resumable session created:', sessionId);

            // Clean up session
            await client.assetManager.cancelUpload(sessionId);
            console.log('   ✓ Session cancelled successfully');

        } catch (sessionError) {
            console.log('   Session error:', sessionError.message);
        }

    } catch (error) {
        console.error('\nError during test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    } finally {
        // Cleanup
        fs.unlinkSync(testFilePath);
        console.log('\n' + '=' .repeat(50));
        console.log('Test completed');
    }
}

// Check if Blob is available in Node.js
if (typeof Blob === 'undefined') {
    console.log('Note: Blob is not available in this Node.js version');
    console.log('Installing node-fetch for Blob support...\n');

    try {
        global.Blob = require('buffer').Blob;
    } catch (e) {
        console.log('Blob not available, using Buffer directly');
    }
}

testRealServer().catch(console.error);
