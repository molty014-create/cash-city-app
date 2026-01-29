import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const generationTime = new Trend('generation_time');
const successRate = new Rate('success_rate');
const failedRequests = new Counter('failed_requests');

// Test NFT images to use (rotating through these)
const TEST_IMAGES = [
  'https://madlads.s3.us-west-2.amazonaws.com/images/2504.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/8966.png',
  'https://madlads.s3.us-west-2.amazonaws.com/images/913.png',
  'https://metadata.degods.com/g/9039-dead-rm.png',
  'https://metadata.degods.com/g/9167-dead-rm.png',
  'https://arweave.net/my0bkydw2dPJsdEuI7BysuJ_gHCN-UloZJGocwnH9II',
  'https://arweave.net/47CcsvsneyFSGKj0k5Kp5Jt63KobY9GIkZtZO5rh7Ao',
  'https://bafybeihazpt6pkm4azgtupdz7hc2j3o4zpmpfvxfaatkp3xh3bpwwqmxfa.ipfs.nftstorage.link',
  'https://shdw-drive.genesysgo.net/6xHqrxNgbbMwfhFTYMHqGSfVzwkNobNz2N3fFMhXAW3N/1745.png',
  'https://arweave.net/KfNOI8MjmHqVSPLu0eg9NQvG2KVsQq4vlj4w7YSN1pI',
];

// Configuration - set via environment or CLI
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://euqbokwvqxbcqdgpgdds.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cWJva3d2cXhiY3FkZ3BnZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NDQ3MjIsImV4cCI6MjA2NDAyMDcyMn0.lv7WqVnJwwvmBWdvxCHgFfQ2B4bR7Nqcqf9KLBX5L9A';
const DRY_RUN = __ENV.DRY_RUN === 'true'; // Skip actual AI generation

// Test scenarios
export const options = {
  scenarios: {
    // Ramp up to 500 users over time
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // Ramp to 50 users
        { duration: '30s', target: 100 },  // Ramp to 100 users
        { duration: '30s', target: 200 },  // Ramp to 200 users
        { duration: '60s', target: 500 },  // Ramp to 500 users
        { duration: '120s', target: 500 }, // Hold at 500 for 2 min
        { duration: '30s', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'success_rate': ['rate>0.95'],           // 95% success rate
    'generation_time': ['p(95)<120000'],     // 95% under 2 minutes
    'http_req_failed': ['rate<0.05'],        // Less than 5% HTTP failures
  },
};

// Alternative: Spike test (immediate 500 users)
export const spikeOptions = {
  scenarios: {
    spike_test: {
      executor: 'constant-vus',
      vus: 500,
      duration: '3m',
    },
  },
};

// Alternative: Stress test (find breaking point)
export const stressOptions = {
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 400 },
        { duration: '2m', target: 500 },
        { duration: '2m', target: 600 },
        { duration: '2m', target: 700 },
        { duration: '2m', target: 800 },
        { duration: '2m', target: 1000 },
        { duration: '1m', target: 0 },
      ],
    },
  },
};

export default function() {
  // Pick a random test image
  const imageUrl = TEST_IMAGES[Math.floor(Math.random() * TEST_IMAGES.length)];
  const walletAddress = `test_${__VU}_${__ITER}_${Date.now()}`;

  const payload = JSON.stringify({
    profile_image_url: imageUrl,
    wallet_address: walletAddress,
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  const startTime = Date.now();

  const response = http.post(
    `${SUPABASE_URL}/functions/v1/generate-character`,
    payload,
    {
      headers: headers,
      timeout: '180s', // 3 minute timeout for AI generation
    }
  );

  const duration = Date.now() - startTime;

  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has generated image': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.generatedImageUrl || body.dryRun;
      } catch {
        return false;
      }
    },
  });

  // Record metrics
  generationTime.add(duration);
  successRate.add(success);

  if (!success) {
    failedRequests.add(1);
    console.log(`FAILED [VU ${__VU}]: ${response.status} - ${response.body}`);
  } else {
    console.log(`SUCCESS [VU ${__VU}]: ${(duration/1000).toFixed(1)}s`);
  }

  // Small sleep between iterations (user think time)
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Summary handler
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalRequests: data.metrics.http_reqs.values.count,
    successRate: (data.metrics.success_rate?.values?.rate * 100 || 0).toFixed(1) + '%',
    avgGenerationTime: ((data.metrics.generation_time?.values?.avg || 0) / 1000).toFixed(1) + 's',
    p95GenerationTime: ((data.metrics.generation_time?.values['p(95)'] || 0) / 1000).toFixed(1) + 's',
    maxVUs: data.metrics.vus_max?.values?.max || 0,
    failedRequests: data.metrics.failed_requests?.values?.count || 0,
  };

  console.log('\n========================================');
  console.log('  LOAD TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Requests:     ${summary.totalRequests}`);
  console.log(`Success Rate:       ${summary.successRate}`);
  console.log(`Avg Generation:     ${summary.avgGenerationTime}`);
  console.log(`P95 Generation:     ${summary.p95GenerationTime}`);
  console.log(`Max Concurrent:     ${summary.maxVUs}`);
  console.log(`Failed Requests:    ${summary.failedRequests}`);
  console.log('========================================\n');

  return {
    'load-test-k6-results.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
