
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const publicDir = path.resolve(process.cwd(), 'public');

// API to get files and directories
app.get('/api/files', (req, res) => {
    const relativePath = req.query.path ? (req.query.path as string) : '';
    const currentPath = path.join(publicDir, relativePath);

    fs.readdir(currentPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }

        const fileData = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
        }))
        .sort((a, b) => {
            // Directories first
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;

            // Natural sort for names
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });
        res.json({
            currentPath: relativePath,
            files: fileData
        });
    });
});

// API to create a new folder
app.post('/api/folders', (req, res) => {
    const folderName = req.body.name;
    const relativePath = req.body.path || '';

    console.log(`Received request to create folder: ${folderName} in path: ${relativePath}`);

    if (!folderName || folderName.includes('/') || folderName.includes('..')) {
        console.error('Invalid folder name received:', folderName);
        return res.status(400).send('Invalid folder name.');
    }

    const currentPath = path.join(publicDir, relativePath);
    const newFolderPath = path.join(currentPath, folderName);

    console.log(`Attempting to create directory at: ${newFolderPath}`);

    fs.mkdir(newFolderPath, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
            return res.status(500).send('Error creating directory: ' + err.message);
        }
        console.log(`Successfully created directory: ${newFolderPath}`);
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

app.post('/api/upload', (req, res) => {
    const uploader = multer({ storage: storage }).array('files', 4000);

    uploader(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(500).json(err);
        }
        else if (err) {
            console.error('Unknown error:', err);
            return res.status(500).json(err);
        }

        console.log(`Files upload request received for path: ${req.body.path}`);
        if (Array.isArray(req.files)) {
            console.log(`Received ${req.files.length} files.`);
            // Log details for each file
            req.files.forEach(file => {
                console.log(`- ${file.originalname} (${file.size} bytes)`);
            });
        } else {
            console.log('No files received or req.files is not an array.');
        }
        
        res.status(200).send('Files uploaded successfully');
    });
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
