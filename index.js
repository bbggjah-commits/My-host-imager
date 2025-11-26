const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ إعدادات CORS للسماح بجميع الطلبات
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// ✅ خدمة الملفات من مجلد public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ إنشاء مجلد التحميلات
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ تم إنشاء مجلد uploads');
}

// ✅ إعداد multer محسّن
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomName}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 15 * 1024 * 1024, // 15MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم! يسمح بالصور فقط (JPEG, PNG, GIF, WEBP, BMP)'));
        }
    }
});

// ✅ Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ نقطة الرفع المحسنة
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        console.log('📨 طلب رفع مستلم');
        
        if (!req.file) {
            console.log('❌ لا يوجد ملف في الطلب');
            return res.status(400).json({
                success: false,
                error: 'لم يتم اختيار أي صورة'
            });
        }

        console.log(`📁 الملف المستلم: ${req.file.originalname} (${req.file.size} bytes)`);

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        console.log(`✅ تم رفع الصورة: ${req.file.filename}`);
        console.log(`🔗 الرابط: ${imageUrl}`);
        
        res.json({
            success: true,
            url: imageUrl,
            filename: req.file.filename,
            size: req.file.size,
            message: 'تم رفع الصورة بنجاح!'
        });

    } catch (error) {
        console.error('❌ خطأ في الرفع:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء رفع الصورة: ' + error.message
        });
    }
});

// ✅ خدمة الملفات المرفوعة
app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, path) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// ✅ معالجة طلبات OPTIONS للـ CORS
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});

// ✅ معالجة الأخطاء المحسنة
app.use((error, req, res, next) => {
    console.error('❌ خطأ في السيرفر:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'حجم الملف كبير جداً! الحد الأقصى 15MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'يمكن رفع ملف واحد فقط في كل مرة'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: error.message || 'حدث خطأ غير متوقع في السيرفر'
    });
});

// ✅ صفحة 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'الصفحة غير موجودة'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VNDXS Image Host يعمل على: http://0.0.0.0:${PORT}`);
    console.log(`📁 مجلد التحميلات: ${uploadsDir}`);
    console.log(`📄 الواجهة: ${path.join(__dirname, 'public', 'index.html')}`);
    console.log(`✅ جاهز لاستقبال الصور...`);
});
