/**
 * Load Test for Cash City AI Generation - 100 NFT PFPs
 *
 * Usage: node load-test-100.cjs [concurrency] [total]
 * Example: node load-test-100.cjs 5 100
 */

const fs = require('fs');

const SUPABASE_URL = 'https://ftmoenjomlkxiarzpgza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bW9lbmpvbWxreGlhcnpwZ3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDA2NTgsImV4cCI6MjA4NTA3NjY1OH0.KghQ9H4rnNKRU4EupXiLxeYfcYWTn7EStrDmQOQefps';

// 100 diverse Solana NFT images from various collections
const TEST_PROFILES = [
  // Mad Lads (5) - 3D anime style
  { url: 'https://madlads.s3.us-west-2.amazonaws.com/images/2504.png', desc: 'Mad Lad #2504' },
  { url: 'https://madlads.s3.us-west-2.amazonaws.com/images/8966.png', desc: 'Mad Lad #8966' },
  { url: 'https://madlads.s3.us-west-2.amazonaws.com/images/913.png', desc: 'Mad Lad #913' },
  { url: 'https://madlads.s3.us-west-2.amazonaws.com/images/3727.png', desc: 'Mad Lad #3727' },
  { url: 'https://madlads.s3.us-west-2.amazonaws.com/images/9701.png', desc: 'Mad Lad #9701' },

  // DeGods (5) - stylized characters
  { url: 'https://metadata.degods.com/g/9039-dead-rm.png', desc: 'DeGod #9039' },
  { url: 'https://metadata.degods.com/g/9167-dead-rm.png', desc: 'DeGod #9167' },
  { url: 'https://metadata.degods.com/g/3936-dead-rm.png', desc: 'DeGod #3936' },
  { url: 'https://metadata.degods.com/g/5526-dead-rm.png', desc: 'DeGod #5526' },
  { url: 'https://metadata.degods.com/g/9193-dead-rm.png', desc: 'DeGod #9193' },

  // Okay Bears (5) - cartoon bears
  { url: 'https://arweave.net/my0bkydw2dPJsdEuI7BysuJ_gHCN-UloZJGocwnH9II', desc: 'Okay Bear #1' },
  { url: 'https://arweave.net/RT1_YxYetKL_jmrYyzATqREs5fmyBovqEkCWy1NTJWc', desc: 'Okay Bear #2' },
  { url: 'https://arweave.net/7OQbvFun1BaXe4fPoD2hGiM94cN09UihVRRJCCWOvfo', desc: 'Okay Bear #3' },
  { url: 'https://arweave.net/47CcsvsneyFSGKj0k5Kp5Jt63KobY9GIkZtZO5rh7Ao', desc: 'Okay Bear #4' },
  { url: 'https://arweave.net/NRPO2T24ycxu3rx3wta000cLhloRB2h7JIUq0H8D458', desc: 'Okay Bear #5' },

  // Famous Fox Federation (5) - cartoon foxes
  { url: 'https://famousfoxes.com/hd/9924.png', desc: 'Fox #9924' },
  { url: 'https://famousfoxes.com/hd/1745.png', desc: 'Fox #1745' },
  { url: 'https://famousfoxes.com/hd/9482.png', desc: 'Fox #9482' },
  { url: 'https://famousfoxes.com/hd/8153.png', desc: 'Fox #8153' },
  { url: 'https://famousfoxes.com/hd/9484.png', desc: 'Fox #9484' },

  // SMB (5) - pixel monkeys
  { url: 'https://arweave.net/3K_8FW8vA5t7Vv-nzKN8ScKG-Z0TLWAyFFyDezz0_jw', desc: 'SMB Monke #1' },
  { url: 'https://arweave.net/V06bEgRKx1-HaJ8pGguIRrTkICmaK6M5yUYauSEvjKQ', desc: 'SMB Monke #2' },
  { url: 'https://arweave.net/YLeGqsZUgXEhsYMiI-8zitefcIutPQIkzgZjwetGpLA', desc: 'SMB Monke #3' },
  { url: 'https://arweave.net/WKniwMqebcHznkuVNTgI28RCneQqtqlPCqZNBZwyo5Y', desc: 'SMB Monke #4' },
  { url: 'https://arweave.net/pq14yZ6Ck5ei5r_kUWvwW0bstY3hhrprvo8p3Ybkjsg', desc: 'SMB Monke #5' },

  // y00ts (5) - stylized avatars
  { url: 'https://metadata.y00ts.com/y/8767.png', desc: 'y00t #8767' },
  { url: 'https://metadata.y00ts.com/y/294.png', desc: 'y00t #294' },
  { url: 'https://metadata.y00ts.com/y/3779.png', desc: 'y00t #3779' },
  { url: 'https://metadata.y00ts.com/y/5363.png', desc: 'y00t #5363' },
  { url: 'https://metadata.y00ts.com/y/5565.png', desc: 'y00t #5565' },

  // Tensorians (5) - robot/cyber style
  { url: 'https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop-metadata/44f27171-430f-42ca-b442-6a75a8daadad/images/9848.png', desc: 'Tensorian #9848' },
  { url: 'https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop-metadata/24f27171-430f-42ca-b442-6a75a8daadad/images/3684.png', desc: 'Tensorian #3684' },
  { url: 'https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop-metadata/14f27171-430f-42ca-b442-6a75a8daadad/images/72.png', desc: 'Tensorian #72' },
  { url: 'https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop-metadata/14f27171-430f-42ca-b442-6a75a8daadad/images/1311.png', desc: 'Tensorian #1311' },
  { url: 'https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop-metadata/14f27171-430f-42ca-b442-6a75a8daadad/images/2184.png', desc: 'Tensorian #2184' },

  // Degen Apes (5) - OG apes
  { url: 'https://arweave.net/RjdQx5NdnvKrXAr3AJ0hwn2HsLX5QW8KAPCcEK6fQkk', desc: 'Degen Ape #1' },
  { url: 'https://arweave.net/uaMMIXuHtlwtoST-U1hlGldO4GRRWSji-g_w-KYUTn4', desc: 'Degen Ape #2' },
  { url: 'https://arweave.net/gh4E2uBB34pviJR_ZLMu4aeucGOAmLLebLdE5hWZATE', desc: 'Degen Ape #3' },
  { url: 'https://arweave.net/9O9bpIgAvBLyxbVl451F3mNb44EUYs5w1dqHusGwLPs', desc: 'Degen Ape #4' },
  { url: 'https://a.traiter.xyz/avatar:4iq0ul6tqchnw6piwofb/1760655842290.png', desc: 'Degen Ape #5' },

  // Trippin Ape Tribe (10) - psychedelic apes
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/9E5jWxDhvCwW35FcBxLpeJwPLVi8AK9uduikLWdWvB3c.png', desc: 'Trippin Ape #1' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/218ybQtbKfAat68BiAyACMTMNbNPPXfBrDTiwWNM3dUg.png', desc: 'Trippin Ape #2' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/5sBRpxtjiWQrmy16iiMaiU6KcX36TubMre4LPinYcXEU.png', desc: 'Trippin Ape #3' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/6NxQojaoJcdt7NmhsuF91KxFgAhn42tNyHEgYKvQw29Z.png', desc: 'Trippin Ape #4' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/6qPPTxnZByDg7MNUzUWmRKp1VBUSDweMp8RFt6vu6BTw.png', desc: 'Trippin Ape #5' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/FieZrjttqgscF6UP6w9bP34cfREAyY1L7SUJrWa9g65j.png', desc: 'Trippin Ape #6' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/DoJyuGQfviBcrnEpLGcHuZGaqbPaR2WG4rBDyD4x27sp.png', desc: 'Trippin Ape #7' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/Bo8zEwMFjq4s5yr7ioF1YqJnGc8ZGuovdyxcTwXytt8W.png', desc: 'Trippin Ape #8' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/Gho7LSMWSMynHoZVxprxhUdFdPyKhJ3gR8eY8eS7cMWp.png', desc: 'Trippin Ape #9' },
  { url: 'https://storage.googleapis.com/reavers-56900.appspot.com/trippin-apes/FfGAFG5pzU2WzK2pJn6r79fUXmGABThn7f6arcSGTMxq.png', desc: 'Trippin Ape #10' },

  // Thugbirdz (5) - bird gangsters
  { url: 'https://arweave.net/9gNvqQZbQtcFPgX6nvx6tR0hQJ1iy7YJG9PXDyheFGg', desc: 'Thugbird #1' },
  { url: 'https://www.arweave.net/pSwVNeSnC5Ut9zNMUGtsR4zPVlHr6Hkn1V48GaNtebE?ext=png', desc: 'Thugbird #2' },
  { url: 'https://arweave.net/knB7LpiNSgxvbbQ4jXAfdyj7ksdX_nQ5U5Pg9-_DNO0', desc: 'Thugbird #3' },
  { url: 'https://arweave.net/wCG7CDAmHlzxzBaDiekv3XVc1VvU9wosHj1V4vEMVaY', desc: 'Thugbird #4' },
  { url: 'https://www.arweave.net/s6yeybuTGTDbMrAB9zgvZt2GHKw_OXKziUb45ea5cLg?ext=png', desc: 'Thugbird #5' },

  // Retardio Cousins (5) - meme style
  { url: 'https://d2nci21ylekf89.cloudfront.net/DUX8SZXLKigc84BBUcYjA7PuKe2SFwXFtQVgwmBsaXKm/1/98da9510efbc1ac9283d6530a3ae8508afadf1263feb1c6ff3768ac7b8f42d33.png', desc: 'Retardio #1' },
  { url: 'https://d2nci21ylekf89.cloudfront.net/DUX8SZXLKigc84BBUcYjA7PuKe2SFwXFtQVgwmBsaXKm/1/1c43e4a044aa4980a6736d703aed84f3cf2fbf8199ed7b322a45c609c6c88a67.png', desc: 'Retardio #2' },
  { url: 'https://d2nci21ylekf89.cloudfront.net/DUX8SZXLKigc84BBUcYjA7PuKe2SFwXFtQVgwmBsaXKm/1/60f77fe16612e49b024d806a82248462ad108cfc4bf952bcbc24c22f9c042535.png', desc: 'Retardio #3' },
  { url: 'https://d2nci21ylekf89.cloudfront.net/DUX8SZXLKigc84BBUcYjA7PuKe2SFwXFtQVgwmBsaXKm/1/9bb930de1b47a36bc8b366c3b7cbbb9a74c4b0e4163722328a2a76bb60c08625.png', desc: 'Retardio #4' },
  { url: 'https://d2nci21ylekf89.cloudfront.net/DUX8SZXLKigc84BBUcYjA7PuKe2SFwXFtQVgwmBsaXKm/1/6a006acc40345b3b60020a40ff93ffdae1586c622f191f896fb775c8f8a6d6e7.png', desc: 'Retardio #5' },

  // Aurory (5) - gaming NFTs
  { url: 'https://aurorians.cdn.aurory.io/aurorians-v2/current/images/full/502.png', desc: 'Aurorian #502' },
  { url: 'https://aurorians.cdn.aurory.io/aurorians-v2/current/images/full/5987-base-background.png', desc: 'Aurorian #5987' },
  { url: 'https://aurorians.cdn.aurory.io/aurorians-v2/current/images/full/7779.png', desc: 'Aurorian #7779' },
  { url: 'https://aurorians.cdn.aurory.io/aurorians-v2/current/images/full/4462.png', desc: 'Aurorian #4462' },
  { url: 'https://aurorians.cdn.aurory.io/aurorians-v2/current/images/full/7601.png', desc: 'Aurorian #7601' },

  // Taiyo Robotics (5) - robots
  { url: 'https://cdn.taiyorobotics.com/images/1c5769ebb795b1465a7f7217daabb1b6.png', desc: 'Taiyo Robot #1' },
  { url: 'https://cdn.taiyorobotics.com/images/f88bff109fff88ddc6aff364eed573e4.png', desc: 'Taiyo Robot #2' },
  { url: 'https://cdn.taiyorobotics.com/images/bb266e009bc8ec0a3975c668e192f93d.png', desc: 'Taiyo Robot #3' },
  { url: 'https://cdn.taiyorobotics.com/images/8a77d94f-6ad7-4d11-a554-86a31fbc6d7c.png?1668308514869', desc: 'Taiyo Robot #4' },
  { url: 'https://nftstorage.link/ipfs/bafybeiedry5o2a5hukxozrvipg4xd2hszgexj4ijhhuriijruszrkplo4a/75.png', desc: 'Taiyo Robot #5' },

  // Grim Syndicate (5) - dark/gothic
  { url: 'https://www.arweave.net/aA4SgFSWAuwEqz4OPxeMOFspx7xBhAotXMNcmZwct5s?ext=png', desc: 'Grim #1' },
  { url: 'https://www.arweave.net/HGxvR0U07C7U6AsyUjYdYJP2ffLqu2Zn5Irjtn0tohI?ext=png', desc: 'Grim #2' },
  { url: 'https://www.arweave.net/9l1PO4X2agovC1dYGpMZZ6GILxhK5_LoUhMhnwc4mxs?ext=png', desc: 'Grim #3' },
  { url: 'https://www.arweave.net/9VIXyLHhCMms8Tfo3MUPVm-36wIzYrCZnrLoLmdkU84?ext=png', desc: 'Grim #4' },
  { url: 'https://www.arweave.net/pi2mLZgZ6mo8T-UulwN9XSrQoUd26GonttYzbwvTgSk?ext=png', desc: 'Grim #5' },

  // Pesky Penguins (10) - pixel penguins
  { url: 'https://cdn.pesky-penguins.com/artwork/1349-pixel.png', desc: 'Pesky Penguin #1349' },
  { url: 'https://cdn.pesky-penguins.com/artwork/8024-pixel.png', desc: 'Pesky Penguin #8024' },
  { url: 'https://cdn.pesky-penguins.com/artwork/3027-pixel.png', desc: 'Pesky Penguin #3027' },
  { url: 'https://cdn.pesky-penguins.com/artwork/1295-pixel.png', desc: 'Pesky Penguin #1295' },
  { url: 'https://cdn.pesky-penguins.com/artwork/1392-pixel.png', desc: 'Pesky Penguin #1392' },
  { url: 'https://cdn.pesky-penguins.com/artwork/4847-pixel.png', desc: 'Pesky Penguin #4847' },
  { url: 'https://cdn.pesky-penguins.com/artwork/4711-pixel.png', desc: 'Pesky Penguin #4711' },
  { url: 'https://cdn.pesky-penguins.com/artwork/2015-pixel.png', desc: 'Pesky Penguin #2015' },
  { url: 'https://cdn.pesky-penguins.com/artwork/5310-pixel.png', desc: 'Pesky Penguin #5310' },
  { url: 'https://cdn.pesky-penguins.com/artwork/2846-pixel.png', desc: 'Pesky Penguin #2846' },

  // Blocksmith Labs (5)
  { url: 'https://metadata.smyths.io/864.png', desc: 'Smyth #864' },
  { url: 'https://metadata.smyths.io/1665.png', desc: 'Smyth #1665' },
  { url: 'https://metadata.smyths.io/2612.png', desc: 'Smyth #2612' },
  { url: 'https://metadata.smyths.io/80.png', desc: 'Smyth #80' },
  { url: 'https://metadata.smyths.io/2145.png', desc: 'Smyth #2145' },

  // Primates (10) - 3D apes
  { url: 'https://gateway.irys.xyz/Avqeq2yMJcu0YT03eD9mC3zQx6n3V7P1cQVD2qjtFHE', desc: 'Primate #1' },
  { url: 'https://gateway.irys.xyz/YlqueSlnixo8SFvKXrxIG3RTbHMZ-tqd-vEIMCD28k4', desc: 'Primate #2' },
  { url: 'https://gateway.irys.xyz/4XCou-eTUz0URPwJQ5rhIR7qUVBJNOyWgb9Ey-BMO20', desc: 'Primate #3' },
  { url: 'https://gateway.irys.xyz/CDUpHP-WgYPq7bfDwPNSGQXpMCUg_r9Klved3IL-rAU', desc: 'Primate #4' },
  { url: 'https://gateway.irys.xyz/xrW5wU-qDMCRFz1ZEJICVusOHv287jD7nPyPt8VyfBA', desc: 'Primate #5' },
  { url: 'https://gateway.irys.xyz/UcqGr37RjHH1UyOdUOf0vMpOVRKx0JIiPmMg1S_92WM', desc: 'Primate #6' },
  { url: 'https://gateway.irys.xyz/gLHbAhOxWXfsjBqzL8wnIpp4zbf7gk5tMFmfJjbc4B4', desc: 'Primate #7' },
  { url: 'https://gateway.irys.xyz/WIvwC8vT4EGMvQOTqNCNd7uge9kdoi4vlD3qOb10Ti8', desc: 'Primate #8' },
  { url: 'https://gateway.irys.xyz/FC5HmiOhTyr4xvNNzACFmff2YlEoVHbAn5PSXiP4z6M', desc: 'Primate #9' },
  { url: 'https://gateway.irys.xyz/BLD-XvQnkNsAFF6odO6oyov1T1i5-Ys9mqMq_oH5XQg', desc: 'Primate #10' },

  // Communi3 (5) - community avatars
  { url: 'https://arweave.net/IoKh1auO6Y_HhsDM8y1PhJog_OWhV5j7E2wC6eaik9Q', desc: 'Communi3 #1' },
  { url: 'https://arweave.net/3ly8t6bjQ-j7tzX0OBUMCu5hByFEvy4dxkDuxAWQdPc', desc: 'Communi3 #2' },
  { url: 'https://arweave.net/pQDcuauhKjAVyxCztbyRvMdcCLjagMFKoeGvUFc1KlQ', desc: 'Communi3 #3' },
  { url: 'https://arweave.net/EfV8UfO57XBdeXsHCdt10Zh5aQfcwFY4ODo4RabHPkKg', desc: 'Communi3 #4' },
  { url: 'https://arweave.net/5wbdlEYoRF7rFVEBt9WwS-bFNxy-AqxHKzSuvGx7j2k', desc: 'Communi3 #5' },
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
  <title>AI Generation Load Test - 100 NFTs</title>
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
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
      gap: 20px;
    }
    .card {
      background: #1a1f1d;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(93, 130, 120, 0.3);
    }
    .card-images {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .card-images img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .img-container {
      position: relative;
    }
    .card-images .label {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0,0,0,0.7);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    .card-info {
      padding: 12px;
    }
    .card-info h3 {
      color: #D5E59B;
      margin: 0 0 6px 0;
      font-size: 14px;
    }
    .card-info p {
      margin: 2px 0;
      font-size: 12px;
      color: rgba(247, 247, 232, 0.7);
    }
    .prompt {
      background: rgba(0,0,0,0.3);
      padding: 8px;
      border-radius: 6px;
      font-size: 10px;
      margin-top: 8px;
      max-height: 60px;
      overflow: hidden;
    }
    .error-card {
      background: rgba(255, 107, 107, 0.1);
      border-color: rgba(255, 107, 107, 0.3);
    }
  </style>
</head>
<body>
  <h1>Cash City AI - 100 NFT Load Test</h1>

  <div class="stats">
    <span class="success">✅ Success: ${successful.length}/${results.length}</span>
    <span class="fail">❌ Failed: ${failed.length}/${results.length}</span>
    <span>⏱️ Total: ${totalTime}s</span>
    <span>📊 Avg: ${(successful.reduce((a, r) => a + r.elapsed, 0) / successful.length || 0).toFixed(1)}s</span>
    <span>🚀 Throughput: ${(results.length / totalTime * 60).toFixed(1)}/min</span>
  </div>

  <div class="grid">
    ${successful.map(r => `
      <div class="card">
        <div class="card-images">
          <div class="img-container">
            <img src="${r.inputImage}" alt="Input" loading="lazy" />
            <div class="label">INPUT</div>
          </div>
          <div class="img-container">
            <img src="${r.outputImage}" alt="Output" loading="lazy" />
            <div class="label">OUTPUT</div>
          </div>
        </div>
        <div class="card-info">
          <h3>#${r.requestId} - ${r.inputDesc}</h3>
          <p>⏱️ ${r.elapsed}s</p>
          <div class="prompt">${r.prompt.slice(0, 200)}...</div>
        </div>
      </div>
    `).join('')}

    ${failed.map(r => `
      <div class="card error-card">
        <div class="card-images">
          <div class="img-container">
            <img src="${r.inputImage}" alt="Input" loading="lazy" />
            <div class="label">INPUT</div>
          </div>
          <div class="img-container" style="background: #2a1f1f; display: flex; align-items: center; justify-content: center;">
            <span style="color: #FF6B6B; font-size: 36px;">✗</span>
          </div>
        </div>
        <div class="card-info">
          <h3>#${r.requestId} - ${r.inputDesc}</h3>
          <p style="color: #FF6B6B;">❌ ${r.error}</p>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  const filename = `load-test-100-results-${Date.now()}.html`;
  fs.writeFileSync(filename, html);
  return filename;
}

async function runLoadTest(concurrency, totalRequests) {
  console.log('\n========================================');
  console.log('  Cash City AI - 100 NFT Load Test');
  console.log('========================================\n');
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Collections: 20+ (Mad Lads, DeGods, Okay Bears, SMB, Apes, etc.)`);
  console.log(`Estimated Cost: $${(totalRequests * 0.12).toFixed(2)}`);
  console.log('\n----------------------------------------\n');

  const results = [];
  let completed = 0;
  let requestId = 1;

  const startTime = Date.now();
  const queue = [];

  while (completed < totalRequests) {
    while (queue.length < concurrency && requestId <= totalRequests) {
      const id = requestId++;
      const profile = TEST_PROFILES[(id - 1) % TEST_PROFILES.length];

      const promise = testGeneration(id, profile).then(result => {
        results.push(result);
        completed++;
        const idx = queue.indexOf(promise);
        if (idx > -1) queue.splice(idx, 1);
        return result;
      });
      queue.push(promise);
    }

    if (queue.length > 0) {
      await Promise.race(queue);
    }
  }

  await Promise.all(queue);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  results.sort((a, b) => a.requestId - b.requestId);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const times = successful.map(r => r.elapsed);
  const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : 'N/A';

  console.log('\n========================================');
  console.log('  Results');
  console.log('========================================\n');
  console.log(`Total Time: ${totalTime}s`);
  console.log(`Throughput: ${(totalRequests / totalTime * 60).toFixed(1)} req/min`);
  console.log(`\nSuccess: ${successful.length}/${totalRequests} (${((successful.length/totalRequests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed.length}/${totalRequests}`);
  console.log(`\nAvg Response: ${avgTime}s`);

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

  const htmlFile = createReviewHTML(results, totalTime);
  console.log(`\n📄 Review: ${htmlFile}`);
  console.log('========================================\n');
}

const args = process.argv.slice(2);
const concurrency = parseInt(args[0]) || 5;
const totalRequests = parseInt(args[1]) || 100;

console.log(`\n⚠️  This will make ${totalRequests} API calls.`);
console.log(`   Estimated cost: $${(totalRequests * 0.12).toFixed(2)}`);
console.log(`\nStarting in 5 seconds... (Ctrl+C to cancel)\n`);

setTimeout(() => {
  runLoadTest(concurrency, totalRequests);
}, 5000);
