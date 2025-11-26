const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - خدمة الملفات من المجلد الحالي
app.use(express.static(__dirname));
app.use(express.json());

// إنشاء مجلد التحميلات
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ تم إنشاء مجلد uploads');
}

// إعداد multer
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomName}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|bmp/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        
        if (mimetype && extname) {
            cb(null, true);
        } else {
            cb(new Error('يسمح بالصور فقط!'));
        }
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'لم يتم اختيار أي صورة'
            });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        console.log(`✅ تم رفع الصورة: ${req.file.filename}`);
        
        res.json({
            success: true,
            url: imageUrl,
            message: 'تم رفع الصورة بنجاح!'
        });

    } catch (error) {
        console.error('❌ خطأ في الرفع:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء رفع الصورة'
        });
    }
});

// خدمة الملفات المرفوعة
app.use('/uploads', express.static(uploadsDir));

// معالجة الأخطاء
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'حجم الملف كبير جداً! الحد الأقصى 15MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: error.message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 VNDXS Image Host يعمل على: ${PORT}`);
    console.log(`📁 مجلد التحميلات: ${uploadsDir}`);
    console.log(`📄 ملف الـ HTML: ${path.join(__dirname, 'index.html')}`);
});
