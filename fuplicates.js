import fs from 'fs';

function overwriteWithUniqueWords() {
  const filePath = 'safe.txt';
while (true) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const data = fs.readFileSync(filePath, 'utf-8').trim();

  if (!data) {
    console.log('⚠️ safe.txt is empty.');
    return;
  }

  // Extract all words and clean them
  const words = data.split(/\s+/).map(word => word.trim()).filter(word => word.length > 0);

  const uniqueWords = Array.from(new Set(words)).sort(); // Optional sort

  console.log(`📄 Total words: ${words.length}`);
  console.log(`✅ Unique words: ${uniqueWords.length}`);

  // Overwrite safe.txt with unique words
  fs.writeFileSync(filePath, uniqueWords.join('\n') + '\n', 'utf-8');
 }
  console.log(`✨ safe.txt updated with unique words only.`);
}

overwriteWithUniqueWords();
