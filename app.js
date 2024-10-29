const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import cors

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://ishana821:P2vL4YzHXI3exPNF@employees.fzvia.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const dataSchema = new mongoose.Schema({}, { strict: false });
const data = mongoose.model('data', dataSchema);

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
    .on('end', () => {
      data.insertMany(fileRows)
        .then(() => {
          res.status(200).json({ message: 'File data uploaded successfully' });
        })
        .catch((error) => {
          res.status(500).json({ message: 'Error saving data', error });
        })
        .finally(() => {
          fs.unlinkSync(req.file.path);
        });
    });
});

app.get('/get-all-data', async (req, res) => {
  try {
    const getData = await data.find({});
    res.status(200).json(getData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});