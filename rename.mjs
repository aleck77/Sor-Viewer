import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'public', 'aaa');

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }

  let i = 300;
  files.forEach((file) => {
    if (file.includes('.sor')) {
      const oldPath = path.join(directoryPath, file);
      const newPath = path.join(directoryPath, `REM${i}.sor`);
      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          console.log('Error renaming file: ' + err);
        } else {
          console.log(`Renamed ${file} to REM${i}.sor`);
        }
      });
      i++;
    }
  });
});
