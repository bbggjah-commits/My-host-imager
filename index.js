const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// إنشاء مجلد التحميلات
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// إعداد multer
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.json({ success: false, error: 'No file uploaded' });
    }
    
    const imageUrl = `https://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({
        success: true,
        url: imageUrl,
        message: 'تم رفع الصورة بنجاح!'
    });
});

// خدمة الملفات المرفوعة
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على البورت: ${PORT}`);
});
