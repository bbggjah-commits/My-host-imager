const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ خدمة الملفات من الجذر الرئيسي
app.use(express.static(__dirname));
app.use(express.json());

// ✅ إنشاء مجلد uploads إذا لم يكن موجوداً
const ensureUploadsDir = () => {
    const uploadsPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log('✅ تم إنشاء مجلد uploads:', uploadsPath);
    }
    return uploadsPath;
};

// ✅ إعداد multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = ensureUploadsDir();
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueName + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('فقط الصور مسموحة!'));
        }
    }
});

// ✅ Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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

        console.log('📊 معلومات الملف:', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // ✅ إصلاح الرابط - استخدام الرابط المطلق الكامل
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
        
        console.log('✅ تم رفع الصورة بنجاح:', imageUrl);
        
        res.json({
            success: true,
            url: imageUrl,
            filename: req.file.filename,
            size: req.file.size,
            message: 'تم رفع الصورة بنجاح! 🎉'
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ معالجة الأخطاء
app.use((error, req, res, next) => {
    console.error('❌ خطأ في السيرفر:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'حجم الملف كبير جداً! الحد الأقصى 10MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: error.message || 'حدث خطأ غير متوقع'
    });
});

app.listen(PORT, () => {
    console.log('🚀 VNDXS Image Host يعمل بنجاح!');
    console.log(`📍 البورت: ${PORT}`);
    console.log('✅ جاهز لاستقبال الصور...');
});
