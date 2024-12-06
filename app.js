const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const app = express();

const backgroundDir = path.join(__dirname, 'src/assets/backgrounds');
const enemyDir = path.join(__dirname, 'src/assets/enemies');
const imagePath = 'src/assets/sprite-sheet.png';
const columns = 10;
const rows = 12;

// Load the sprite sheet metadata
async function getSprite(row, column) {
  // Get metadata of the sprite sheet
  const metadata = await sharp(imagePath).metadata();
  
  // Calculate sprite dimensions
  const spriteWidth = Math.floor(metadata.width / columns);
  const spriteHeight = Math.floor(metadata.height / rows);

  // Extract the specific sprite and return it as a buffer
  return sharp(imagePath)
    .extract({
      left: column * spriteWidth,
      top: row * spriteHeight,
      width: spriteWidth,
      height: spriteHeight,
    })
    .toBuffer(); // Returns a buffer that can be directly used in HTTP response
}

// Route to serve random background image
app.get('/random-background', (req, res) => {
  fs.readdir(backgroundDir, (err, files) => {
    if (err) {
      res.status(500).send('Error reading background directory');

      return;
    }

    const randomImage = files[Math.floor(Math.random() * files.length)];
    res.sendFile(path.join(backgroundDir, randomImage));
  });
});

// Route to serve random enemy image
app.get('/random-enemy', (req, res) => {
  fs.readdir(enemyDir, (err, files) => {
    if (err) {
      res.status(500).send('Error reading enemy directory');

      return;
    }

    const randomImage = files[Math.floor(Math.random() * files.length)];
    res.sendFile(path.join(enemyDir, randomImage));
  });
});

// Serve the extracted sprite from memory
app.get('/sprite/:row/:column', async (req, res) => {
  try {
    const row = parseInt(req.params.row);
    const column = parseInt(req.params.column);
    
    if (row >= rows || column >= columns || row < 0 || column < 0) {
      return res.status(400).send('Invalid sprite coordinates');
    }
    
    const spriteBuffer = await getSprite(row, column);

    res.set('Content-Type', 'image/png');
    res.send(spriteBuffer);
  }
  
  catch (err) {
    console.error('Error extracting sprite:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Serve static files (like the index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
