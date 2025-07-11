
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const publicDir = path.resolve(process.cwd(), 'public');

// API to get files and directories
app.get('/api/files', (req, res) => {
    const currentPath = req.query.path ? path.join(publicDir, req.query.path as string) : publicDir;

    fs.readdir(currentPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }

        const fileData = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
        }));

        res.json(fileData);
    });
});

// API to create a new folder
app.post('/api/folders', (req, res) => {
    const folderName = req.body.name;
    const currentPath = req.body.path ? path.join(publicDir, req.body.path) : publicDir;
    const newFolderPath = path.join(currentPath, folderName);

    fs.mkdir(newFolderPath, { recursive: true }, (err) => {
        if (err) {
            return res.status(500).send('Error creating directory: ' + err);
        }
        res.status(200).send('Directory created successfully');
    });
});

// API for file uploads
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        const destPath = _req.body.path ? path.join(publicDir, _req.body.path) : publicDir;
        cb(null, destPath);
    },
    filename: function (_req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (_req, res) => {
    res.status(200).send('File uploaded successfully');
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
