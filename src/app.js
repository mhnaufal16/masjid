const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const { initDB } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDB();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// (expressLayouts is now only used in admin routes)
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));

// Session
app.use(session({
  secret: 'masjid-al-ikhlas-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Halaman Tidak Ditemukan', layout: false });
});

app.listen(PORT, () => {
  console.log(`\n🕌 Masjid Al-Ikhlas Landing Page`);
  console.log(`✅ Server berjalan di: http://localhost:${PORT}`);
  console.log(`🔐 Backoffice: http://localhost:${PORT}/admin`);
  console.log(`👤 Login: admin / admin123\n`);
});
