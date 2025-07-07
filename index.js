// 📁 مشروع استضافة مواقع HTML/JS
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد المجلد الرئيسي للملفات
const SITES_DIR = path.join(__dirname, 'sites');
if (!fs.existsSync(SITES_DIR)) fs.mkdirSync(SITES_DIR);

// التخزين
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const siteID = req.siteID;
    const uploadPath = path.join(SITES_DIR, siteID);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// الواجهة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// توليد ID
app.use('/upload', (req, res, next) => {
  req.siteID = uuidv4();
  next();
});

// رفع الملفات
app.post('/upload', upload.array('files'), (req, res) => {
  const siteID = req.siteID;
  const link = `/view/${siteID}/index.html`;

  // حفظ معلومات العرض
  const infoPath = path.join(SITES_DIR, 'sites.json');
  let db = [];
  if (fs.existsSync(infoPath)) db = JSON.parse(fs.readFileSync(infoPath));
  db.push({ id: siteID, link });
  fs.writeFileSync(infoPath, JSON.stringify(db, null, 2));

  res.send(`✅ تم رفع ملفاتك! <a href="${link}" target="_blank">عرض موقعك</a>`);
});

// عرض المواقع
app.use('/view/:siteID', (req, res, next) => {
  const sitePath = path.join(SITES_DIR, req.params.siteID);
  express.static(sitePath)(req, res, next);
});

// صفحة لعرض كل المواقع
app.get('/sites', (req, res) => {
  const infoPath = path.join(SITES_DIR, 'sites.json');
  let db = [];
  if (fs.existsSync(infoPath)) db = JSON.parse(fs.readFileSync(infoPath));

  let list = db.map(site => `
    <li>
      🔗 <a href="${site.link}" target="_blank">${site.link}</a>
    </li>
  `).join('');

  res.send(`
    <html>
      <head>
        <title>📦 قائمة المواقع</title>
        <style>
          body { font-family: sans-serif; padding: 40px; background: #0f0f0f; color: #fff; }
          h1 { color: #0ff; }
          ul { list-style: none; padding: 0; }
          li { margin-bottom: 10px; }
          a { color: #0cf; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>🗂️ قائمة المواقع المستضافة</h1>
        <ul>${list}</ul>
        <br>
        <a href="/">⬅️ العودة للواجهة</a>
      </body>
    </html>
  `);
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`✅ السيرفر يعمل على http://localhost:${PORT}`);
});
