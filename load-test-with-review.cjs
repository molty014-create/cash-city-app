/**
 * Load Test for Cash City AI Generation - With Image Review
 *
 * Usage: node load-test-with-review.cjs [concurrency] [total]
 * Example: node load-test-with-review.cjs 3 10
 *
 * Creates an HTML file to review all generated images
 */

const fs = require('fs');

const SUPABASE_URL = 'https://ftmoenjomlkxiarzpgza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bW9lbmpvbWxreGlhcnpwZ3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDA2NTgsImV4cCI6MjA4NTA3NjY1OH0.KghQ9H4rnNKRU4EupXiLxeYfcYWTn7EStrDmQOQefps';

// Mixed profile images - NFTs, real photos, anime, etc.
const TEST_PROFILES = [
  // === SOLANA NFTs (75% of users) ===
  // Mad Lads
  { url: 'https://madlads.s3.us-west-2.amazonaws.com/images/2504.png', desc: 'Mad Lad #2504 (NFT)' },
  { url: 'https://madlads.s3.us-west-2.amazonaws.com/images/8966.png', desc: 'Mad Lad #8966 (NFT)' },
  // DeGods
  { url: 'https://metadata.degods.com/g/9039-dead-rm.png', desc: 'DeGod #9039 (NFT)' },
  { url: 'https://metadata.degods.com/g/9167-dead-rm.png', desc: 'DeGod #9167 (NFT)' },
  // Okay Bears
  { url: 'https://arweave.net/my0bkydw2dPJsdEuI7BysuJ_gHCN-UloZJGocwnH9II', desc: 'Okay Bear (NFT)' },
  { url: 'https://arweave.net/47CcsvsneyFSGKj0k5Kp5Jt63KobY9GIkZtZO5rh7Ao', desc: 'Okay Bear #2 (NFT)' },
  // Famous Fox Federation
  { url: 'https://famousfoxes.com/hd/9924.png', desc: 'Fox #9924 (NFT)' },
  { url: 'https://famousfoxes.com/hd/1745.png', desc: 'Fox #1745 (NFT)' },
  // SMB & y00ts
  { url: 'https://arweave.net/3K_8FW8vA5t7Vv-nzKN8ScKG-Z0TLWAyFFyDezz0_jw', desc: 'SMB Monke (NFT)' },
  { url: 'https://metadata.y00ts.com/y/294.png', desc: 'y00t #294 (NFT)' },
  { url: 'https://metadata.y00ts.com/y/8767.png', desc: 'y00t #8767 (NFT)' },

  // === REAL PHOTOS (25% of users) ===
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', desc: 'Man with beard (Photo)' },
  { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face', desc: 'Woman smiling (Photo)' },
  { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', desc: 'Man with glasses (Photo)' },
  { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face', desc: 'Man sunglasses (Photo)' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face', desc: 'Woman blonde (Photo)' },
];

// Generate random wallet address for testing
function randomWallet() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function testGeneration(requestId, profile) {
  const walletAddress = randomWallet();
  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-character`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profile_image_url: profile.url,
        wallet_address: walletAddress
      })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const data = await response.json();

    if (response.ok && data.image_url) {
      console.log(`✅ #${requestId} (${profile.desc}): SUCCESS in ${elapsed}s`);
      return {
        success: true,
        elapsed: parseFloat(elapsed),
        requestId,
        inputImage: profile.url,
        inputDesc: profile.desc,
        outputImage: data.image_url,
        prompt: data.prompt || 'N/A',
        analysis: data.analysis || {}
      };
    } else {
      console.log(`❌ #${requestId} (${profile.desc}): FAILED in ${elapsed}s - ${data.error || 'Unknown'}`);
      return {
        success: false,
        elapsed: parseFloat(elapsed),
        requestId,
        inputImage: profile.url,
        inputDesc: profile.desc,
        error: data.error || 'Unknown error'
      };
    }
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ #${requestId} (${profile.desc}): ERROR in ${elapsed}s - ${err.message}`);
    return {
      success: false,
      elapsed: parseFloat(elapsed),
      requestId,
      inputImage: profile.url,
      inputDesc: profile.desc,
      error: err.message
    };
  }
}

function createReviewHTML(results, totalTime) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>AI Generation Load Test Results</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0f0d;
      color: #F7F7E8;
      padding: 20px;
      margin: 0;
    }
    h1 { text-align: center; color: #D5E59B; margin-bottom: 10px; }
    .stats {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(213, 229, 155, 0.1);
      border-radius: 12px;
    }
    .stats span { margin: 0 15px; }
    .success { color: #4ADE80; }
    .fail { color: #FF6B6B; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 24px;
    }
    .card {
      background: #1a1f1d;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(93, 130, 120, 0.3);
    }
    .card-images {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .card-images img {
      width: 100%;
      height: 250px;
      object-fit: cover;
    }
    .card-images .label {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0,0,0,0.7);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .img-container {
      position: relative;
    }
    .card-info {
      padding: 16px;
    }
    .card-info h3 {
      color: #D5E59B;
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    .card-info p {
      margin: 4px 0;
      font-size: 13px;
      color: rgba(247, 247, 232, 0.7);
    }
    .prompt {
      background: rgba(0,0,0,0.3);
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      margin-top: 10px;
      word-break: break-word;
    }
    .analysis {
      font-size: 11px;
      color: rgba(247, 247, 232, 0.5);
      margin-top: 8px;
    }
    .error-card {
      background: rgba(255, 107, 107, 0.1);
      border-color: rgba(255, 107, 107, 0.3);
    }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
      .card-images { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <h1>🏙️ Cash City AI Generation Test Results</h1>

  <div class="stats">
    <span class="success">✅ Success: ${successful.length}/${results.length}</span>
    <span class="fail">❌ Failed: ${failed.length}/${results.length}</span>
    <span>⏱️ Total Time: ${totalTime}s</span>
    <span>📊 Avg: ${(results.filter(r => r.success).reduce((a, r) => a + r.elapsed, 0) / successful.length || 0).toFixed(1)}s</span>
  </div>

  <div class="grid">
    ${successful.map(r => `
      <div class="card">
        <div class="card-images">
          <div class="img-container">
            <img src="${r.inputImage}" alt="Input" />
            <div class="label">INPUT</div>
          </div>
          <div class="img-container">
            <img src="${r.outputImage}" alt="Output" />
            <div class="label">OUTPUT</div>
          </div>
        </div>
        <div class="card-info">
          <h3>#${r.requestId} - ${r.inputDesc}</h3>
          <p>⏱️ Generated in ${r.elapsed}s</p>
          <div class="prompt">
            <strong>Prompt:</strong> ${r.prompt}
          </div>
          <div class="analysis">
            <strong>Analysis:</strong> ${JSON.stringify(r.analysis, null, 0).slice(0, 200)}...
          </div>
        </div>
      </div>
    `).join('')}

    ${failed.map(r => `
      <div class="card error-card">
        <div class="card-images">
          <div class="img-container">
            <img src="${r.inputImage}" alt="Input" />
            <div class="label">INPUT</div>
          </div>
          <div class="img-container" style="background: #2a1f1f; display: flex; align-items: center; justify-content: center;">
            <span style="color: #FF6B6B; font-size: 48px;">✗</span>
          </div>
        </div>
        <div class="card-info">
          <h3>#${r.requestId} - ${r.inputDesc}</h3>
          <p style="color: #FF6B6B;">❌ Error: ${r.error}</p>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  const filename = `load-test-results-${Date.now()}.html`;
  fs.writeFileSync(filename, html);
  return filename;
}

async function runLoadTest(concurrency, totalRequests) {
  console.log('\n========================================');
  console.log('  Cash City AI Generation Load Test');
  console.log('  (With Image Review)');
  console.log('========================================\n');
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Unique Profiles: ${Math.min(totalRequests, TEST_PROFILES.length)}`);
  console.log(`Estimated Cost: $${(totalRequests * 0.10).toFixed(2)} - $${(totalRequests * 0.15).toFixed(2)}`);
  console.log('\n----------------------------------------\n');

  const results = [];
  let completed = 0;
  let requestId = 1;

  const startTime = Date.now();

  // Process requests with concurrency limit
  const queue = [];

  while (completed < totalRequests) {
    // Fill up to concurrency limit
    while (queue.length < concurrency && requestId <= totalRequests) {
      const id = requestId++;
      // Cycle through profiles, ensuring variety
      const profile = TEST_PROFILES[(id - 1) % TEST_PROFILES.length];

      const promise = testGeneration(id, profile).then(result => {
        results.push(result);
        completed++;
        // Remove from queue
        const idx = queue.indexOf(promise);
        if (idx > -1) queue.splice(idx, 1);
        return result;
      });
      queue.push(promise);
    }

    // Wait for at least one to complete
    if (queue.length > 0) {
      await Promise.race(queue);
    }
  }

  // Wait for all remaining
  await Promise.all(queue);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // Sort results by requestId
  results.sort((a, b) => a.requestId - b.requestId);

  // Calculate stats
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const times = successful.map(r => r.elapsed);
  const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : 'N/A';
  const minTime = times.length > 0 ? Math.min(...times).toFixed(1) : 'N/A';
  const maxTime = times.length > 0 ? Math.max(...times).toFixed(1) : 'N/A';

  console.log('\n========================================');
  console.log('  Results');
  console.log('========================================\n');
  console.log(`Total Time: ${totalTime}s`);
  console.log(`Throughput: ${(totalRequests / totalTime).toFixed(2)} req/s`);
  console.log(`\nSuccess: ${successful.length}/${totalRequests} (${((successful.length/totalRequests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed.length}/${totalRequests}`);
  console.log(`\nResponse Times:`);
  console.log(`  Min: ${minTime}s`);
  console.log(`  Avg: ${avgTime}s`);
  console.log(`  Max: ${maxTime}s`);

  if (failed.length > 0) {
    console.log(`\nErrors:`);
    const errorCounts = {};
    failed.forEach(f => {
      const err = f.error || 'Unknown';
      errorCounts[err] = (errorCounts[err] || 0) + 1;
    });
    Object.entries(errorCounts).forEach(([err, count]) => {
      console.log(`  - ${err}: ${count}x`);
    });
  }

  // Create HTML review file
  const htmlFile = createReviewHTML(results, totalTime);
  console.log(`\n📄 Review file created: ${htmlFile}`);
  console.log(`   Open in browser to compare input → output images\n`);

  console.log('========================================\n');
}

// Parse command line args
const args = process.argv.slice(2);
const concurrency = parseInt(args[0]) || 3;
const totalRequests = parseInt(args[1]) || 5;

// Confirm before running
console.log(`\n⚠️  This will make ${totalRequests} API calls.`);
console.log(`   Using ${Math.min(totalRequests, TEST_PROFILES.length)} different profile images`);
console.log(`   Estimated cost: $${(totalRequests * 0.10).toFixed(2)} - $${(totalRequests * 0.15).toFixed(2)}`);
console.log(`\nStarting in 3 seconds... (Ctrl+C to cancel)\n`);

setTimeout(() => {
  runLoadTest(concurrency, totalRequests);
}, 3000);
