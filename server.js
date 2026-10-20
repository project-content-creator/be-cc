import dotenv from 'dotenv';
import app from './src/app.js';

dotenv.config();

// const app = express();
const PORT = process.env.PORT || 5000;

// Baris ini HARUS ada agar server tidak langsung keluar/exit
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});