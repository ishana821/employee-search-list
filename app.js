const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const dataSchema = new mongoose.Schema(
  {
    emp_id: { type: String, unique: true },
    name: String,
    profession: String,
  },
  { strict: false }
);

const Data = mongoose.model('Data', dataSchema);

const upload = multer({ dest: 'uploads/' });

app.post('/upload-csv-file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  const fileRows = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      fileRows.push(row);
    })
    .on('end', async () => {
      try {
        for (const row of fileRows) {
          await Data.findOneAndUpdate(
            { emp_id: row.emp_id },
            row,
            { upsert: true, new: true } 
          );
        }
        res.status(200).json({ message: 'File data uploaded successfully, duplicates avoided' });
      } catch (error) {
        res.status(500).json({ message: 'Error saving data', error });
      } finally {
        fs.unlinkSync(req.file.path);
      }
    });
});

app.get('/get-all-data', async (req, res) => {
  try {
    const getData = await Data.find({});
    res.status(200).json(getData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
