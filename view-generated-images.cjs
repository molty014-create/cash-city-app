/**
 * View Recently Generated Images
 *
 * Fetches and displays URLs of recently generated AI images
 */

const SUPABASE_URL = 'https://ftmoenjomlkxiarzpgza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bW9lbmpvbWxreGlhcnpwZ3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDA2NTgsImV4cCI6MjA4NTA3NjY1OH0.KghQ9H4rnNKRU4EupXiLxeYfcYWTn7EStrDmQOQefps';

async function fetchRecentImages() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/applications?select=wallet_address,twitter_handle,generated_image_url,created_at&order=created_at.desc&limit=20&generated_image_url=not.is.null`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();

  console.log('\n========================================');
  console.log('  Recent Generated Images');
  console.log('========================================\n');

  if (!data || data.length === 0) {
    console.log('No generated images found in database.\n');
    return;
  }

  data.forEach((app, i) => {
    console.log(`${i + 1}. ${app.twitter_handle || 'Unknown'}`);
    console.log(`   Wallet: ${app.wallet_address?.slice(0, 8)}...`);
    console.log(`   Created: ${new Date(app.created_at).toLocaleString()}`);
    console.log(`   Image: ${app.generated_image_url}`);
    console.log('');
  });

  console.log('========================================');
  console.log(`Total: ${data.length} images`);
  console.log('========================================\n');

  // Also create an HTML file to view them easily
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Generated Images Review</title>
  <style>
    body { font-family: sans-serif; background: #1a1a1a; color: white; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .card { background: #2a2a2a; border-radius: 12px; overflow: hidden; }
    .card img { width: 100%; height: auto; }
    .card-info { padding: 12px; }
    .card-info p { margin: 4px 0; font-size: 14px; color: #aaa; }
    h1 { text-align: center; color: #D5E59B; }
  </style>
</head>
<body>
  <h1>Generated CEO Images (${data.length})</h1>
  <div class="grid">
    ${data.map(app => `
      <div class="card">
        <img src="${app.generated_image_url}" alt="Generated image" loading="lazy" />
        <div class="card-info">
          <p><strong>${app.twitter_handle || 'Unknown'}</strong></p>
          <p>${new Date(app.created_at).toLocaleString()}</p>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  const fs = require('fs');
  fs.writeFileSync('generated-images-review.html', html);
  console.log('📄 Created generated-images-review.html - open in browser to view images\n');
}

fetchRecentImages().catch(console.error);
