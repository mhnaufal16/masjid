// ===== MASJID AL-IKHLAS - MAIN JS =====

document.addEventListener('DOMContentLoaded', function () {

  // ===== NAVBAR SCROLL EFFECT =====
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
    // Back to top
    backToTop?.classList.toggle('visible', window.scrollY > 400);
  });

  // ===== MOBILE NAV =====
  const mobileBtn = document.querySelector('.nav-mobile-btn');
  const navMenu = document.querySelector('.nav-menu');
  mobileBtn?.addEventListener('click', () => {
    navMenu?.classList.toggle('open');
    const icon = mobileBtn.querySelector('svg');
    mobileBtn.querySelector('.hamburger-icon').textContent = navMenu?.classList.contains('open') ? '✕' : '☰';
  });

  // Close mobile nav on link click
  navMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('open'));
  });

  // ===== ACTIVE NAV LINK =====
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a[href*="#"]');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 100;
    sections.forEach(section => {
      if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
        navLinks.forEach(l => l.classList.remove('active'));
        const correspondingLink = document.querySelector(`.nav-menu a[href*="#${section.id}"]`);
        correspondingLink?.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();

  // ===== PRAYER TIME HIGHLIGHT =====
  function highlightCurrentPrayer() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour * 60 + currentMin;

    const prayerItems = document.querySelectorAll('.jadwal-item');

    prayerItems.forEach(item => {
      item.classList.remove('aktif');
      const timeEl = item.querySelector('.jadwal-time');
      if (!timeEl) return;

      const [h, m] = timeEl.textContent.trim().split(':').map(Number);
      const prayerMin = h * 60 + m;

      if (Math.abs(currentTime - prayerMin) < 60) {
        item.classList.add('aktif');
      }
    });
  }

  highlightCurrentPrayer();
  setInterval(highlightCurrentPrayer, 60000);

  // ===== DIGITAL CLOCK =====
  function updateClock() {
    const clockEl = document.getElementById('current-time');
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ===== GALERI FILTER =====
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galeriItems = document.querySelectorAll('.galeri-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      galeriItems.forEach(item => {
        const kat = item.dataset.kategori;
        const show = filter === 'semua' || kat === filter;
        item.style.display = show ? '' : 'none';
        if (show) {
          item.style.animation = 'fadeInUp 0.4s ease';
        }
      });
    });
  });

  // ===== LIGHTBOX =====
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  galeriItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.galeri-overlay h4')?.textContent;
      if (img) {
        lightboxImg.src = img.src;
        lightboxCaption.textContent = caption || '';
        lightbox?.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  function closeLightbox() {
    lightbox?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ===== COPY REKENING =====
  document.querySelectorAll('.rekening-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const noRek = btn.closest('.rekening-card')?.querySelector('.rekening-number')?.textContent;
      if (noRek) {
        navigator.clipboard.writeText(noRek.trim()).then(() => {
          const original = btn.textContent;
          btn.textContent = '✓ Tersalin!';
          btn.style.background = 'var(--accent)';
          btn.style.color = '#0f3d25';
          setTimeout(() => {
            btn.textContent = original;
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
        });
      }
    });
  });

  // ===== ANIMATE PROGRESS BAR =====
  const progressBar = document.querySelector('.progress-fill');
  if (progressBar) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const width = progressBar.dataset.width;
          setTimeout(() => {
            progressBar.style.width = width + '%';
          }, 300);
          observer.unobserve(progressBar);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(progressBar);
  }

  // ===== FADE IN ANIMATION =====
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  fadeEls.forEach(el => fadeObserver.observe(el));

  // ===== BACK TO TOP =====
  const backToTop = document.getElementById('back-to-top');
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== UPDATE TANGGAL =====
  const tanggalEl = document.getElementById('tanggal-hijri');
  if (tanggalEl) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    tanggalEl.textContent = now.toLocaleDateString('id-ID', options);
  }

  // ===== COUNTER ANIMATION =====
  function animateCounter(el) {
    const target = parseInt(el.textContent.replace(/\D/g, ''));
    const suffix = el.textContent.replace(/[\d]/g, '');
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current) + suffix;
    }, 16);
  }

  const counters = document.querySelectorAll('.hero-stat-value');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        window.scrollTo({
          top: target.offsetTop - offset,
          behavior: 'smooth'
        });
      }
    });
  });
});
