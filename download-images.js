const fs = require('fs');
const https = require('https');
const path = require('path');

const imgDir = path.join(__dirname, 'public/images');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Helper to download image
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(imgDir, filename);
    if (fs.existsSync(dest)) return resolve(); // Skip if exists
    
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, filename).then(resolve).catch(reject);
      }
      
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded:', filename);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      console.error('Error downloading', filename, err.message);
      resolve(); // resolve anyway to continue
    });
  });
}

const images = [
  { name: 'hero-masjid.jpg', url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1920&q=80' },
  { name: 'about-masjid.jpg', url: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=800&q=80' },
  { name: 'kegiatan-1.jpg', url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80' },
  { name: 'kegiatan-2.jpg', url: 'https://images.unsplash.com/photo-1572097463695-46eb611be263?auto=format&fit=crop&w=600&q=80' },
  { name: 'kegiatan-3.jpg', url: 'https://images.unsplash.com/photo-1606558458763-7eb928a39151?auto=format&fit=crop&w=600&q=80' },
  { name: 'kegiatan-4.jpg', url: 'https://images.unsplash.com/photo-1566898436577-fb1f2c2596be?auto=format&fit=crop&w=600&q=80' },
  { name: 'artikel-1.jpg', url: 'https://images.unsplash.com/photo-1519817914152-2a640c547c32?auto=format&fit=crop&w=800&q=80' },
  { name: 'artikel-2.jpg', url: 'https://images.unsplash.com/photo-1594951139369-0f46cfa6ceba?auto=format&fit=crop&w=800&q=80' },
  { name: 'artikel-3.jpg', url: 'https://images.unsplash.com/photo-1561726053-911bcda3769c?auto=format&fit=crop&w=800&q=80' },
  { name: 'galeri-1.jpg', url: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=800&q=80' },
  { name: 'galeri-2.jpg', url: 'https://images.unsplash.com/photo-1551041777-ed277b8dd348?auto=format&fit=crop&w=800&q=80' },
  { name: 'galeri-3.jpg', url: 'https://images.unsplash.com/photo-1580227918349-43c391745428?auto=format&fit=crop&w=800&q=80' },
  { name: 'galeri-4.jpg', url: 'https://images.unsplash.com/photo-1601666352097-f58c42a208f6?auto=format&fit=crop&w=800&q=80' },
  { name: 'galeri-5.jpg', url: 'https://images.unsplash.com/photo-1590077428593-a55bb07c4665?auto=format&fit=crop&w=800&q=80' },
  { name: 'galeri-6.jpg', url: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80' },
];

async function run() {
  console.log('Downloading beautiful placeholder images...');
  for (const img of images) {
    await downloadImage(img.url, img.name);
  }
  console.log('All images downloaded successfully!');
}

run();
