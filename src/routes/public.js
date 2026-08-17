const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(row => settings[row.key] = row.value);
  return settings;
}

// Home page
router.get('/', (req, res) => {
  const db = getDB();
  const settings = getSettings(db);
  const navMenu = db.prepare('SELECT * FROM nav_menu WHERE aktif = 1 ORDER BY urutan').all();
  const kegiatan = db.prepare('SELECT * FROM kegiatan WHERE aktif = 1 ORDER BY urutan LIMIT 6').all();
  const galeri = db.prepare('SELECT * FROM galeri WHERE aktif = 1 ORDER BY created_at DESC LIMIT 8').all();
  const galeriKategori = db.prepare('SELECT DISTINCT kategori FROM galeri WHERE aktif = 1').all().map(r => r.kategori);
  const artikel = db.prepare('SELECT * FROM artikel WHERE aktif = 1 ORDER BY created_at DESC LIMIT 3').all();
  const jadwal = db.prepare('SELECT * FROM jadwal_sholat ORDER BY id DESC LIMIT 1').get();
  const donasi = db.prepare('SELECT * FROM donasi WHERE aktif = 1 ORDER BY urutan').all();
  const slider = db.prepare('SELECT * FROM slider WHERE aktif = 1 ORDER BY urutan').all();

  res.render('public/index', {
    title: `${settings.masjid_nama} - ${settings.masjid_slogan}`,
    settings,
    navMenu,
    kegiatan,
    galeri,
    galeriKategori,
    artikel,
    jadwal,
    donasi,
    slider,
  });
});

// Artikel detail
router.get('/artikel/:slug', (req, res) => {
  const db = getDB();
  const settings = getSettings(db);
  const navMenu = db.prepare('SELECT * FROM nav_menu WHERE aktif = 1 ORDER BY urutan').all();
  const artikel = db.prepare('SELECT * FROM artikel WHERE slug = ? AND aktif = 1').get(req.params.slug);
  
  if (!artikel) return res.redirect('/');
  
  const artikelTerkait = db.prepare('SELECT * FROM artikel WHERE aktif = 1 AND id != ? ORDER BY created_at DESC LIMIT 3').all(artikel.id);

  res.render('public/artikel-detail', {
    title: `${artikel.judul} - ${settings.masjid_nama}`,
    settings,
    navMenu,
    artikel,
    artikelTerkait,
  });
});

module.exports = router;
