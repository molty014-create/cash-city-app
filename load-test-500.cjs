/**
 * Cash City - 500 User Stress Test
 *
 * Simulates 500 concurrent users generating images
 *
 * Usage:
 *   node load-test-500.cjs [concurrent] [total] [--dry-run]
 *
 * Examples:
 *   node load-test-500.cjs 500 500           # 500 concurrent, 500 total (real AI)
 *   node load-test-500.cjs 500 500 --dry-run # Infrastructure test only
 *   node load-test-500.cjs 100 500           # 100 concurrent, 500 total
 */

const https = require('https');
const http = require('http');

// Configuration
const SUPABASE_URL = 'https://ftmoenjomlkxiarzpgza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bW9lbmpvbWxreGlhcnpwZ3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDA2NTgsImV4cCI6MjA4NTA3NjY1OH0.KghQ9H4rnNKRU4EupXiLxeYfcYWTn7EStrDmQOQefps';

// Diverse test images - using reliable sources
const TEST_IMAGES = [
  // Mad Lads (working)
  'https://madlads.s3.us-west-2.amazonaws.com/images/2504.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/8966.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/913.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/3727.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/9701.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/1234.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/5678.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/4321.png',
  // DeGods (working)
  'https://metadata.degods.com/g/9039-dead-rm.png',
  'https://metadata.degods.com/g/9167-dead-rm.png',
  'https://metadata.degods.com/g/3936-dead-rm.png',
  'https://metadata.degods.com/g/5526-dead-rm.png',
];

// Parse args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const numericArgs = args.filter(a => !a.startsWith('--')).map(Number);
const CONCURRENCY = numericArgs[0] || 500;
const TOTAL_REQUESTS = numericArgs[1] || 500;

// Stats tracking
const stats = {
  started: 0,
  completed: 0,
  succeeded: 0,
  failed: 0,
  times: [],
  errors: [],
  startTime: null,
  activeRequests: 0,
  peakConcurrent: 0,
};

// Generate a valid Solana-like base58 address for testing
function generateTestWalletAddress(index) {
  // Solana addresses are 32-44 chars, base58 encoded
  // Using a deterministic but valid-looking format
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = '';
  // Use index and timestamp as seed
  const seed = index * 1000000 + (Date.now() % 1000000);
  let n = seed;
  for (let i = 0; i < 44; i++) {
    address += base58Chars[(n + i * 7) % base58Chars.length];
    n = (n * 31 + i) % 10000000;
  }
  return address;
}

// Make a single request
async function makeRequest(index) {
  const imageUrl = TEST_IMAGES[index % TEST_IMAGES.length];
  const walletAddress = generateTestWalletAddress(index);

  const payload = JSON.stringify({
    profile_image_url: imageUrl,
    wallet_address: walletAddress,
    dry_run: DRY_RUN,
  });

  const startTime = Date.now();
  stats.activeRequests++;
  stats.peakConcurrent = Math.max(stats.peakConcurrent, stats.activeRequests);

  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/functions/v1/generate-character`);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 180000, // 3 minute timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        stats.activeRequests--;
        stats.completed++;

        if (res.statusCode === 200) {
          stats.succeeded++;
          stats.times.push(duration);
          const emoji = DRY_RUN ? '🔵' : '✅';
          console.log(`${emoji} #${index + 1}: SUCCESS in ${(duration/1000).toFixed(1)}s (active: ${stats.activeRequests})`);
        } else {
          stats.failed++;
          stats.errors.push({ index, status: res.statusCode, body: data.slice(0, 200) });
          console.log(`❌ #${index + 1}: FAILED (${res.statusCode}) - ${data.slice(0, 100)}`);
        }

        resolve();
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      stats.activeRequests--;
      stats.completed++;
      stats.failed++;
      stats.errors.push({ index, error: err.message });
      console.log(`❌ #${index + 1}: ERROR - ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      stats.activeRequests--;
      stats.completed++;
      stats.failed++;
      stats.errors.push({ index, error: 'Timeout' });
      console.log(`❌ #${index + 1}: TIMEOUT`);
      req.destroy();
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// Concurrent execution with semaphore
async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const promise = task().then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });

    results.push(promise);
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// Progress display
function showProgress() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const rate = stats.completed / elapsed;
  const remaining = (TOTAL_REQUESTS - stats.completed) / rate;

  process.stdout.write(`\r[${stats.completed}/${TOTAL_REQUESTS}] ` +
    `Success: ${stats.succeeded} | Failed: ${stats.failed} | ` +
    `Active: ${stats.activeRequests} | ` +
    `Rate: ${rate.toFixed(1)}/s | ` +
    `ETA: ${remaining.toFixed(0)}s   `);
}

// Main test
async function runStressTest() {
  const estimatedCost = DRY_RUN ? 0 : (TOTAL_REQUESTS * 0.12);

  console.log('\n========================================');
  console.log('  Cash City - 500 User Stress Test');
  console.log('========================================\n');
  console.log(`Mode:          ${DRY_RUN ? '🔵 DRY RUN (infrastructure only)' : '🔴 REAL AI GENERATION'}`);
  console.log(`Concurrency:   ${CONCURRENCY} simultaneous users`);
  console.log(`Total:         ${TOTAL_REQUESTS} requests`);
  console.log(`Est. Cost:     $${estimatedCost.toFixed(2)}`);
  console.log(`Test Images:   ${TEST_IMAGES.length} unique NFTs\n`);

  if (!DRY_RUN && TOTAL_REQUESTS >= 100) {
    console.log(`⚠️  WARNING: This will make ${TOTAL_REQUESTS} REAL AI generations!`);
    console.log(`   Estimated cost: $${estimatedCost.toFixed(2)}\n`);
    console.log('Starting in 5 seconds... (Ctrl+C to cancel)\n');
    await new Promise(r => setTimeout(r, 5000));
  }

  stats.startTime = Date.now();

  // Create all tasks
  const tasks = Array.from({ length: TOTAL_REQUESTS }, (_, i) => () => makeRequest(i));

  // Start progress display
  const progressInterval = setInterval(showProgress, 1000);

  // Run all requests with concurrency limit
  await runWithConcurrency(tasks, CONCURRENCY);

  clearInterval(progressInterval);

  // Calculate final stats
  const totalTime = (Date.now() - stats.startTime) / 1000;
  const avgTime = stats.times.length > 0
    ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length / 1000
    : 0;
  const p95Time = stats.times.length > 0
    ? stats.times.sort((a, b) => a - b)[Math.floor(stats.times.length * 0.95)] / 1000
    : 0;
  const minTime = stats.times.length > 0 ? Math.min(...stats.times) / 1000 : 0;
  const maxTime = stats.times.length > 0 ? Math.max(...stats.times) / 1000 : 0;

  console.log('\n\n========================================');
  console.log('  STRESS TEST RESULTS');
  console.log('========================================\n');
  console.log(`Total Time:        ${totalTime.toFixed(1)}s`);
  console.log(`Throughput:        ${(TOTAL_REQUESTS / totalTime * 60).toFixed(1)} req/min`);
  console.log(`Peak Concurrent:   ${stats.peakConcurrent}`);
  console.log('');
  console.log(`Success:           ${stats.succeeded}/${TOTAL_REQUESTS} (${(stats.succeeded/TOTAL_REQUESTS*100).toFixed(1)}%)`);
  console.log(`Failed:            ${stats.failed}/${TOTAL_REQUESTS}`);
  console.log('');
  console.log(`Avg Response:      ${avgTime.toFixed(1)}s`);
  console.log(`P95 Response:      ${p95Time.toFixed(1)}s`);
  console.log(`Min Response:      ${minTime.toFixed(1)}s`);
  console.log(`Max Response:      ${maxTime.toFixed(1)}s`);
  console.log('');

  if (stats.errors.length > 0) {
    console.log(`\nErrors (first 10):`);
    stats.errors.slice(0, 10).forEach(err => {
      console.log(`  - #${err.index + 1}: ${err.error || `HTTP ${err.status}`}`);
    });
  }

  // Success criteria
  const successRate = stats.succeeded / TOTAL_REQUESTS;
  console.log('\n========================================');
  if (successRate >= 0.95) {
    console.log('  ✅ PASSED - System handles 500 concurrent users');
  } else if (successRate >= 0.80) {
    console.log('  ⚠️  WARNING - Some failures under load');
  } else {
    console.log('  ❌ FAILED - System cannot handle this load');
  }
  console.log('========================================\n');
}

runStressTest().catch(console.error);
