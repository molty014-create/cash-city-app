/**
 * Load Test for Cash City AI Generation
 *
 * Usage: node load-test.cjs [concurrency] [total]
 * Example: node load-test.cjs 5 10  (5 concurrent, 10 total requests)
 */

const SUPABASE_URL = 'https://ftmoenjomlkxiarzpgza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bW9lbmpvbWxreGlhcnpwZ3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDA2NTgsImV4cCI6MjA4NTA3NjY1OH0.KghQ9H4rnNKRU4EupXiLxeYfcYWTn7EStrDmQOQefps';

// Test profile images (Unsplash - stable URLs)
const TEST_PROFILES = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
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

async function testGeneration(requestId) {
  const profileImage = TEST_PROFILES[Math.floor(Math.random() * TEST_PROFILES.length)];
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
        profile_image_url: profileImage,
        wallet_address: walletAddress
      })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const data = await response.json();

    if (response.ok && data.image_url) {
      console.log(`✅ Request #${requestId}: SUCCESS in ${elapsed}s`);
      return { success: true, elapsed: parseFloat(elapsed), requestId };
    } else {
      console.log(`❌ Request #${requestId}: FAILED in ${elapsed}s - ${data.error || 'Unknown error'}`);
      return { success: false, elapsed: parseFloat(elapsed), requestId, error: data.error };
    }
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ Request #${requestId}: ERROR in ${elapsed}s - ${err.message}`);
    return { success: false, elapsed: parseFloat(elapsed), requestId, error: err.message };
  }
}

async function runLoadTest(concurrency, totalRequests) {
  console.log('\n========================================');
  console.log('  Cash City AI Generation Load Test');
  console.log('========================================\n');
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Total Requests: ${totalRequests}`);
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
      const promise = testGeneration(id).then(result => {
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

  // Calculate stats
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const times = results.map(r => r.elapsed);
  const avgTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
  const minTime = Math.min(...times).toFixed(1);
  const maxTime = Math.max(...times).toFixed(1);

  console.log('\n========================================');
  console.log('  Results');
  console.log('========================================\n');
  console.log(`Total Time: ${totalTime}s`);
  console.log(`Requests/sec: ${(totalRequests / totalTime).toFixed(2)}`);
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

  console.log('\n========================================\n');
}

// Parse command line args
const args = process.argv.slice(2);
const concurrency = parseInt(args[0]) || 3;
const totalRequests = parseInt(args[1]) || 5;

// Confirm before running
console.log(`\n⚠️  This will make ${totalRequests} API calls.`);
console.log(`   Estimated cost: $${(totalRequests * 0.10).toFixed(2)} - $${(totalRequests * 0.15).toFixed(2)}`);
console.log(`\nStarting in 3 seconds... (Ctrl+C to cancel)\n`);

setTimeout(() => {
  runLoadTest(concurrency, totalRequests);
}, 3000);
