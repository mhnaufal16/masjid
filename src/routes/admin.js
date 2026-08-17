const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const expressLayouts = require('express-ejs-layouts');

// Enable layouts only for admin routes
router.use(expressLayouts);

// Set layout for all admin routes
router.use((req, res, next) => {
  res.locals.layout = 'admin/layout';
  next();
});
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../database/db');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Auth middleware
function isAdmin(req, res, next) {
  if (req.session.user) return next();
  req.flash('error', 'Silakan login terlebih dahulu');
  res.redirect('/admin/login');
}

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(row => settings[row.key] = row.value);
  return settings;
}

// ===== ROOT REDIRECT =====
router.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/admin/dashboard');
  res.redirect('/admin/login');
});

// ===== AUTH =====
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin/dashboard');
  res.render('admin/login', { title: 'Login Admin', layout: false });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    req.flash('error', 'Username atau password salah');
    return res.redirect('/admin/login');
  }
  
  req.session.user = { id: admin.id, username: admin.username, name: admin.name };
  req.flash('success', `Selamat datang, ${admin.name}!`);
  res.redirect('/admin/dashboard');
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ===== DASHBOARD =====
router.get('/dashboard', isAdmin, (req, res) => {
  const db = getDB();
  const settings = getSettings(db);
  const stats = {
    kegiatan: db.prepare('SELECT COUNT(*) as count FROM kegiatan').get().count,
    galeri: db.prepare('SELECT COUNT(*) as count FROM galeri').get().count,
    artikel: db.prepare('SELECT COUNT(*) as count FROM artikel').get().count,
    donasi: db.prepare('SELECT COUNT(*) as count FROM donasi').get().count,
  };
  const artikelTerbaru = db.prepare('SELECT * FROM artikel ORDER BY created_at DESC LIMIT 5').all();
  const galeriTerbaru = db.prepare('SELECT * FROM galeri ORDER BY created_at DESC LIMIT 5').all();
  
  res.render('admin/dashboard', {
    title: 'Dashboard - Admin',
    settings, stats, artikelTerbaru, galeriTerbaru,
    activePage: 'dashboard'
  });
});

// ===== PENGATURAN =====
router.get('/pengaturan', isAdmin, (req, res) => {
  const db = getDB();
  const settings = getSettings(db);
  res.render('admin/pengaturan', { title: 'Pengaturan - Admin', settings, activePage: 'pengaturan' });
});

router.post('/pengaturan', isAdmin, upload.fields([
  { name: 'masjid_logo', maxCount: 1 },
  { name: 'hero_gambar', maxCount: 1 },
  { name: 'about_gambar', maxCount: 1 },
]), (req, res) => {
  const db = getDB();
  const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  // Update text settings
  for (const [key, value] of Object.entries(req.body)) {
    updateSetting.run(key, value);
  }
  
  // Update file settings
  if (req.files) {
    for (const [fieldname, files] of Object.entries(req.files)) {
      if (files.length > 0) {
        updateSetting.run(fieldname, '/uploads/' + files[0].filename);
      }
    }
  }
  
  req.flash('success', 'Pengaturan berhasil disimpan!');
  res.redirect('/admin/pengaturan');
});

// ===== KEGIATAN =====
router.get('/kegiatan', isAdmin, (req, res) => {
  const db = getDB();
  const kegiatan = db.prepare('SELECT * FROM kegiatan ORDER BY urutan, created_at DESC').all();
  res.render('admin/kegiatan', { title: 'Kelola Kegiatan - Admin', kegiatan, activePage: 'kegiatan' });
});

router.get('/kegiatan/tambah', isAdmin, (req, res) => {
  res.render('admin/kegiatan-form', { title: 'Tambah Kegiatan', kegiatan: null, activePage: 'kegiatan' });
});

router.post('/kegiatan', isAdmin, upload.single('gambar'), (req, res) => {
  const db = getDB();
  const { judul, deskripsi, tanggal, waktu, lokasi, kategori, urutan } = req.body;
  const gambar = req.file ? '/uploads/' + req.file.filename : null;
  db.prepare('INSERT INTO kegiatan (judul, deskripsi, tanggal, waktu, lokasi, kategori, gambar, urutan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(judul, deskripsi, tanggal, waktu, lokasi, kategori, gambar, urutan || 0);
  req.flash('success', 'Kegiatan berhasil ditambahkan!');
  res.redirect('/admin/kegiatan');
});

router.get('/kegiatan/:id/edit', isAdmin, (req, res) => {
  const db = getDB();
  const kegiatan = db.prepare('SELECT * FROM kegiatan WHERE id = ?').get(req.params.id);
  if (!kegiatan) return res.redirect('/admin/kegiatan');
  res.render('admin/kegiatan-form', { title: 'Edit Kegiatan', kegiatan, activePage: 'kegiatan' });
});

router.put('/kegiatan/:id', isAdmin, upload.single('gambar'), (req, res) => {
  const db = getDB();
  const { judul, deskripsi, tanggal, waktu, lokasi, kategori, urutan, aktif } = req.body;
  const existing = db.prepare('SELECT gambar FROM kegiatan WHERE id = ?').get(req.params.id);
  const gambar = req.file ? '/uploads/' + req.file.filename : existing?.gambar;
  db.prepare('UPDATE kegiatan SET judul=?, deskripsi=?, tanggal=?, waktu=?, lokasi=?, kategori=?, gambar=?, urutan=?, aktif=? WHERE id=?')
    .run(judul, deskripsi, tanggal, waktu, lokasi, kategori, gambar, urutan || 0, aktif ? 1 : 0, req.params.id);
  req.flash('success', 'Kegiatan berhasil diperbarui!');
  res.redirect('/admin/kegiatan');
});

router.delete('/kegiatan/:id', isAdmin, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM kegiatan WHERE id = ?').run(req.params.id);
  req.flash('success', 'Kegiatan berhasil dihapus!');
  res.redirect('/admin/kegiatan');
});

// ===== GALERI =====
router.get('/galeri', isAdmin, (req, res) => {
  const db = getDB();
  const galeri = db.prepare('SELECT * FROM galeri ORDER BY created_at DESC').all();
  res.render('admin/galeri', { title: 'Kelola Galeri - Admin', galeri, activePage: 'galeri' });
});

router.post('/galeri', isAdmin, upload.single('gambar'), (req, res) => {
  const db = getDB();
  const { judul, deskripsi, kategori, tanggal } = req.body;
  const gambar = req.file ? '/uploads/' + req.file.filename : '/images/galeri-placeholder.jpg';
  db.prepare('INSERT INTO galeri (judul, deskripsi, gambar, kategori, tanggal) VALUES (?, ?, ?, ?, ?)')
    .run(judul, deskripsi, gambar, kategori, tanggal);
  req.flash('success', 'Foto berhasil ditambahkan ke galeri!');
  res.redirect('/admin/galeri');
});

router.delete('/galeri/:id', isAdmin, (req, res) => {
  const db = getDB();
  const galeri = db.prepare('SELECT gambar FROM galeri WHERE id = ?').get(req.params.id);
  if (galeri && galeri.gambar && galeri.gambar.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../../public', galeri.gambar);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare('DELETE FROM galeri WHERE id = ?').run(req.params.id);
  req.flash('success', 'Foto berhasil dihapus!');
  res.redirect('/admin/galeri');
});

// ===== ARTIKEL =====
router.get('/artikel', isAdmin, (req, res) => {
  const db = getDB();
  const artikel = db.prepare('SELECT * FROM artikel ORDER BY created_at DESC').all();
  res.render('admin/artikel', { title: 'Kelola Artikel - Admin', artikel, activePage: 'artikel' });
});

router.get('/artikel/tambah', isAdmin, (req, res) => {
  res.render('admin/artikel-form', { title: 'Tambah Artikel', artikel: null, activePage: 'artikel' });
});

router.post('/artikel', isAdmin, upload.single('gambar'), (req, res) => {
  const db = getDB();
  const { judul, konten, ringkasan, kategori, penulis } = req.body;
  const slug = judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const gambar = req.file ? '/uploads/' + req.file.filename : null;
  db.prepare('INSERT INTO artikel (judul, slug, konten, ringkasan, gambar, kategori, penulis) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(judul, slug, konten, ringkasan, gambar, kategori, penulis || 'Admin');
  req.flash('success', 'Artikel berhasil dipublikasikan!');
  res.redirect('/admin/artikel');
});

router.get('/artikel/:id/edit', isAdmin, (req, res) => {
  const db = getDB();
  const artikel = db.prepare('SELECT * FROM artikel WHERE id = ?').get(req.params.id);
  if (!artikel) return res.redirect('/admin/artikel');
  res.render('admin/artikel-form', { title: 'Edit Artikel', artikel, activePage: 'artikel' });
});

router.put('/artikel/:id', isAdmin, upload.single('gambar'), (req, res) => {
  const db = getDB();
  const { judul, konten, ringkasan, kategori, penulis, aktif } = req.body;
  const existing = db.prepare('SELECT gambar FROM artikel WHERE id = ?').get(req.params.id);
  const gambar = req.file ? '/uploads/' + req.file.filename : existing?.gambar;
  db.prepare('UPDATE artikel SET judul=?, konten=?, ringkasan=?, gambar=?, kategori=?, penulis=?, aktif=? WHERE id=?')
    .run(judul, konten, ringkasan, gambar, kategori, penulis, aktif ? 1 : 0, req.params.id);
  req.flash('success', 'Artikel berhasil diperbarui!');
  res.redirect('/admin/artikel');
});

router.delete('/artikel/:id', isAdmin, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM artikel WHERE id = ?').run(req.params.id);
  req.flash('success', 'Artikel berhasil dihapus!');
  res.redirect('/admin/artikel');
});

// ===== JADWAL SHOLAT =====
router.get('/jadwal-sholat', isAdmin, (req, res) => {
  const db = getDB();
  const jadwal = db.prepare('SELECT * FROM jadwal_sholat ORDER BY id DESC LIMIT 1').get();
  res.render('admin/jadwal-sholat', { title: 'Jadwal Sholat - Admin', jadwal, activePage: 'jadwal' });
});

router.post('/jadwal-sholat', isAdmin, (req, res) => {
  const db = getDB();
  const { hari, subuh, dzuhur, ashar, maghrib, isya } = req.body;
  const existing = db.prepare('SELECT id FROM jadwal_sholat ORDER BY id DESC LIMIT 1').get();
  if (existing) {
    db.prepare('UPDATE jadwal_sholat SET hari=?, subuh=?, dzuhur=?, ashar=?, maghrib=?, isya=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(hari, subuh, dzuhur, ashar, maghrib, isya, existing.id);
  } else {
    db.prepare('INSERT INTO jadwal_sholat (hari, subuh, dzuhur, ashar, maghrib, isya) VALUES (?, ?, ?, ?, ?, ?)')
      .run(hari, subuh, dzuhur, ashar, maghrib, isya);
  }
  req.flash('success', 'Jadwal sholat berhasil diperbarui!');
  res.redirect('/admin/jadwal-sholat');
});

// ===== DONASI =====
router.get('/donasi', isAdmin, (req, res) => {
  const db = getDB();
  const donasiList = db.prepare('SELECT * FROM donasi ORDER BY urutan').all();
  res.render('admin/donasi', { title: 'Kelola Donasi - Admin', donasiList, activePage: 'donasi' });
});

router.post('/donasi', isAdmin, (req, res) => {
  const db = getDB();
  const { nama_bank, no_rekening, nama_pemilik, keterangan } = req.body;
  db.prepare('INSERT INTO donasi (nama_bank, no_rekening, nama_pemilik, keterangan) VALUES (?, ?, ?, ?)')
    .run(nama_bank, no_rekening, nama_pemilik, keterangan);
  req.flash('success', 'Rekening donasi berhasil ditambahkan!');
  res.redirect('/admin/donasi');
});

router.delete('/donasi/:id', isAdmin, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM donasi WHERE id = ?').run(req.params.id);
  req.flash('success', 'Rekening donasi berhasil dihapus!');
  res.redirect('/admin/donasi');
});

// ===== GANTI PASSWORD =====
router.post('/ganti-password', isAdmin, (req, res) => {
  const db = getDB();
  const { password_lama, password_baru, konfirmasi } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.session.user.id);
  
  if (!bcrypt.compareSync(password_lama, admin.password)) {
    req.flash('error', 'Password lama tidak sesuai!');
    return res.redirect('/admin/pengaturan');
  }
  
  if (password_baru !== konfirmasi) {
    req.flash('error', 'Konfirmasi password tidak cocok!');
    return res.redirect('/admin/pengaturan');
  }
  
  const hashed = bcrypt.hashSync(password_baru, 10);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashed, admin.id);
  req.flash('success', 'Password berhasil diubah!');
  res.redirect('/admin/pengaturan');
});

module.exports = router;
