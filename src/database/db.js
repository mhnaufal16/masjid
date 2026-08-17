const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/masjid.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDB() {
  const db = getDB();

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kegiatan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      deskripsi TEXT,
      tanggal TEXT,
      waktu TEXT,
      lokasi TEXT,
      kategori TEXT DEFAULT 'Umum',
      gambar TEXT,
      aktif INTEGER DEFAULT 1,
      urutan INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS galeri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      deskripsi TEXT,
      gambar TEXT NOT NULL,
      kategori TEXT DEFAULT 'Kegiatan',
      tanggal TEXT,
      aktif INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS artikel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      slug TEXT UNIQUE,
      konten TEXT,
      ringkasan TEXT,
      gambar TEXT,
      kategori TEXT DEFAULT 'Umum',
      penulis TEXT DEFAULT 'Admin',
      aktif INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jadwal_sholat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hari TEXT,
      subuh TEXT,
      dzuhur TEXT,
      ashar TEXT,
      maghrib TEXT,
      isya TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS donasi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_bank TEXT NOT NULL,
      no_rekening TEXT NOT NULL,
      nama_pemilik TEXT NOT NULL,
      keterangan TEXT,
      aktif INTEGER DEFAULT 1,
      urutan INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS nav_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      urutan INTEGER DEFAULT 0,
      aktif INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS slider (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT,
      subtitle TEXT,
      gambar TEXT,
      link TEXT,
      aktif INTEGER DEFAULT 1,
      urutan INTEGER DEFAULT 0
    );
  `);

  // Seed default data if not exists
  seedDefaultData(db);
}

function seedDefaultData(db) {
  // Default admin
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (adminCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password, name) VALUES (?, ?, ?)').run('admin', hashedPassword, 'Administrator');
  }

  // Default settings
  const defaultSettings = {
    // Profil Masjid
    'masjid_nama': 'Masjid Al-Ikhlas',
    'masjid_slogan': 'Menyemai Iman, Menebar Kebaikan',
    'masjid_deskripsi': 'Masjid Al-Ikhlas adalah masjid yang berdiri di tengah-tengah masyarakat sebagai pusat ibadah, pendidikan, dan kegiatan sosial yang bermanfaat bagi umat Islam dan masyarakat sekitar.',
    'masjid_alamat': 'Jl. Masjid Al-Ikhlas No. 1, Jakarta Selatan',
    'masjid_telepon': '(021) 1234-5678',
    'masjid_email': 'info@masjid-alikhlas.id',
    'masjid_logo': '/images/logo-masjid.png',
    
    // Hero Section
    'hero_judul': 'Selamat Datang di Masjid Al-Ikhlas',
    'hero_subtitle': 'Pusat ibadah dan kegiatan Islam yang menyemai iman dan menebar kebaikan untuk seluruh umat.',
    'hero_gambar': '/images/hero-masjid.jpg',
    'hero_btn_teks': 'Lihat Kegiatan',
    'hero_btn_link': '#kegiatan',
    
    // About Section
    'about_judul': 'Tentang Masjid Al-Ikhlas',
    'about_teks': 'Masjid Al-Ikhlas didirikan pada tahun 1985 sebagai pusat kegiatan keislaman di wilayah kami. Dengan visi menjadi masjid yang maju dan modern, kami terus berupaya memberikan pelayanan terbaik bagi jamaah.',
    'about_visi': 'Menjadi masjid yang maju, modern, dan bermanfaat bagi umat dan masyarakat.',
    'about_misi': 'Membina keimanan, pendidikan Islam, dan kesejahteraan umat melalui program-program berkualitas.',
    'about_gambar': '/images/about-masjid.jpg',
    
    // Social Media
    'sosmed_facebook': 'https://facebook.com/masjid-alikhlas',
    'sosmed_instagram': 'https://instagram.com/masjid_alikhlas',
    'sosmed_youtube': 'https://youtube.com/masjid-alikhlas',
    'sosmed_twitter': '',
    
    // Ticker / Hadis
    'ticker_hadis': '"Sesungguhnya masjid-masjid itu adalah milik Allah." (QS. Al-Jin: 18)',
    'ticker_aktif': '1',
    
    // Donasi Section
    'donasi_judul': 'Donasi & Infaq',
    'donasi_deskripsi': 'Salurkan donasi Anda untuk pembangunan dan operasional Masjid Al-Ikhlas. Setiap kontribusi Anda sangat berarti.',
    'donasi_target': '500000000',
    'donasi_terkumpul': '350000000',

    // Statistik
    'stat_jamaah': '2000+',
    'stat_kegiatan': '50+',
    'stat_program': '15+',
    'stat_tahun': '35+',

    // Footer
    'footer_deskripsi': 'Masjid Al-Ikhlas adalah pusat kegiatan keislaman yang berkomitmen untuk melayani umat dengan sepenuh hati.',
    'footer_copyright': '© 2024 Masjid Al-Ikhlas. Hak Cipta Dilindungi.',
  };

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  // Default nav menu
  const navCount = db.prepare('SELECT COUNT(*) as count FROM nav_menu').get();
  if (navCount.count === 0) {
    const menus = [
      ['Beranda', '/#beranda', 1],
      ['Profil', '/#profil', 2],
      ['Jadwal', '/#jadwal', 3],
      ['Kegiatan', '/#kegiatan', 4],
      ['Galeri', '/#galeri', 5],
      ['Artikel', '/#artikel', 6],
      ['Donasi', '/#donasi', 7],
      ['Kontak', '/#kontak', 8],
    ];
    const insertMenu = db.prepare('INSERT INTO nav_menu (label, url, urutan) VALUES (?, ?, ?)');
    menus.forEach(m => insertMenu.run(...m));
  }

  // Default jadwal sholat
  const jadwalCount = db.prepare('SELECT COUNT(*) as count FROM jadwal_sholat').get();
  if (jadwalCount.count === 0) {
    db.prepare(`INSERT INTO jadwal_sholat (hari, subuh, dzuhur, ashar, maghrib, isya) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('Senin - Minggu', '04:28', '11:54', '15:14', '17:48', '19:02');
  }

  // Default kegiatan
  const kegiatanCount = db.prepare('SELECT COUNT(*) as count FROM kegiatan').get();
  if (kegiatanCount.count === 0) {
    const kegiatanData = [
      ['Kajian Subuh Harian', 'Kajian rutin setiap hari setelah sholat Subuh berjamaah', 'Setiap Hari', '05:00', 'Masjid Al-Ikhlas', 'Kajian', '/images/kegiatan-1.jpg', 1, 1],
      ['Pengajian Ibu-Ibu', 'Pengajian rutin untuk ibu-ibu jamaah setiap minggu', 'Setiap Minggu', '09:00', 'Masjid Al-Ikhlas', 'Pengajian', '/images/kegiatan-2.jpg', 1, 2],
      ['Sekolah Tahfidz Anak', 'Program menghafal Al-Quran untuk anak-anak usia 6-15 tahun', 'Senin & Kamis', '15:30', 'Masjid Al-Ikhlas', 'Pendidikan', '/images/kegiatan-3.jpg', 1, 3],
      ['Kajian Kitab Kuning', 'Kajian kitab klasik bersama ustadz berpengalaman', 'Sabtu', '20:00', 'Masjid Al-Ikhlas', 'Kajian', '/images/kegiatan-4.jpg', 1, 4],
    ];
    const insertKegiatan = db.prepare('INSERT INTO kegiatan (judul, deskripsi, tanggal, waktu, lokasi, kategori, gambar, aktif, urutan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    kegiatanData.forEach(k => insertKegiatan.run(...k));
  }

  // Default artikel
  const artikelCount = db.prepare('SELECT COUNT(*) as count FROM artikel').get();
  if (artikelCount.count === 0) {
    const artikelData = [
      ['Keutamaan Sholat Berjamaah di Masjid', 'keutamaan-sholat-berjamaah', '<p>Sholat berjamaah memiliki banyak keutamaan...</p>', 'Sholat berjamaah memiliki pahala 27 derajat lebih tinggi dari sholat sendirian.', '/images/artikel-1.jpg', 'Fiqih', 'Ustadz Ahmad', 1],
      ['Program Ramadhan 1446 H Masjid Al-Ikhlas', 'program-ramadhan-1446', '<p>Menyambut bulan suci Ramadhan...</p>', 'Berbagai program spesial Ramadhan siap hadir untuk jamaah Masjid Al-Ikhlas.', '/images/artikel-2.jpg', 'Pengumuman', 'Admin', 1],
      ['Laporan Keuangan Masjid Bulan Mei 2025', 'laporan-keuangan-mei-2025', '<p>Berikut laporan keuangan masjid...</p>', 'Transparansi keuangan Masjid Al-Ikhlas untuk bulan Mei 2025.', '/images/artikel-3.jpg', 'Keuangan', 'Bendahara', 1],
    ];
    const insertArtikel = db.prepare('INSERT INTO artikel (judul, slug, konten, ringkasan, gambar, kategori, penulis, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    artikelData.forEach(a => insertArtikel.run(...a));
  }

  // Default donasi rekening
  const donasiCount = db.prepare('SELECT COUNT(*) as count FROM donasi').get();
  if (donasiCount.count === 0) {
    const donasiData = [
      ['Bank BCA', '1234567890', 'Yayasan Masjid Al-Ikhlas', 'Rekening Operasional Masjid', 1, 1],
      ['Bank Mandiri', '0987654321', 'Yayasan Masjid Al-Ikhlas', 'Rekening Pembangunan Masjid', 1, 2],
      ['Bank Syariah Indonesia', '1122334455', 'Yayasan Masjid Al-Ikhlas', 'Rekening Zakat & Infaq', 1, 3],
    ];
    const insertDonasi = db.prepare('INSERT INTO donasi (nama_bank, no_rekening, nama_pemilik, keterangan, aktif, urutan) VALUES (?, ?, ?, ?, ?, ?)');
    donasiData.forEach(d => insertDonasi.run(...d));
  }

  // Default galeri
  const galeriCount = db.prepare('SELECT COUNT(*) as count FROM galeri').get();
  if (galeriCount.count === 0) {
    const galeriData = [
      ['Kajian Rutin Ba\'da Maghrib', 'Dokumentasi kajian rutin jamaah', '/images/galeri-1.jpg', 'Kegiatan', '2025-05-12'],
      ['Peringatan Nuzulul Quran 1446 H', 'Peringatan turunnya Al-Quran', '/images/galeri-2.jpg', 'Hari Besar Islam', '2025-03-17'],
      ['Proses Pembangunan Masjid', 'Dokumentasi renovasi masjid', '/images/galeri-3.jpg', 'Pembangunan', '2025-01-22'],
      ['Mentoring Remaja Masjid', 'Kegiatan pembinaan remaja', '/images/galeri-4.jpg', 'Remaja & Pemuda', '2025-05-05'],
      ['Berbagi Berkah Jumat', 'Kegiatan sosial pembagian sembako', '/images/galeri-5.jpg', 'Kegiatan', '2025-05-09'],
      ['Kajian Kitab Riyadhus Shalihin', 'Kajian kitab bersama ustadz', '/images/galeri-6.jpg', 'Kajian & Pengajian', '2025-05-03'],
    ];
    const insertGaleri = db.prepare('INSERT INTO galeri (judul, deskripsi, gambar, kategori, tanggal) VALUES (?, ?, ?, ?, ?)');
    galeriData.forEach(g => insertGaleri.run(...g));
  }
}

module.exports = { getDB, initDB };
