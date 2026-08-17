// ===== ADMIN BACKOFFICE JS =====

document.addEventListener('DOMContentLoaded', function () {

  // ===== AUTO DISMISS FLASH MESSAGES =====
  const flashMessages = document.querySelectorAll('.flash');
  flashMessages.forEach((flash, index) => {
    setTimeout(() => {
      flash.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => flash.remove(), 300);
    }, 4000 + index * 500);

    flash.querySelector('.flash-close')?.addEventListener('click', () => {
      flash.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => flash.remove(), 300);
    });
  });

  // ===== DELETE CONFIRMATION =====
  const deleteOverlay = document.getElementById('delete-overlay');
  let deletePendingForm = null;

  document.querySelectorAll('[data-delete-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      deletePendingForm = btn.closest('form') || document.getElementById(btn.dataset.formId);
      const itemName = btn.dataset.name || 'item ini';
      const desc = deleteOverlay?.querySelector('.delete-desc');
      if (desc) desc.textContent = `Apakah Anda yakin ingin menghapus "${itemName}"? Tindakan ini tidak dapat dibatalkan.`;
      deleteOverlay?.classList.add('open');
    });
  });

  document.getElementById('delete-cancel')?.addEventListener('click', () => {
    deleteOverlay?.classList.remove('open');
    deletePendingForm = null;
  });

  document.getElementById('delete-confirm')?.addEventListener('click', () => {
    if (deletePendingForm) {
      deletePendingForm.submit();
    }
    deleteOverlay?.classList.remove('open');
  });

  deleteOverlay?.addEventListener('click', (e) => {
    if (e.target === deleteOverlay) {
      deleteOverlay.classList.remove('open');
      deletePendingForm = null;
    }
  });

  // ===== SETTINGS TABS =====
  const tabBtns = document.querySelectorAll('.settings-tab');
  const tabPanels = document.querySelectorAll('.settings-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target)?.classList.add('active');
    });
  });

  // ===== IMAGE PREVIEW =====
  document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewId = this.dataset.preview;
        const preview = document.getElementById(previewId) || this.parentElement.querySelector('.img-preview');
        if (preview) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    });
  });

  // ===== FILE UPLOAD DRAG & DROP =====
  document.querySelectorAll('.file-upload-area').forEach(area => {
    area.addEventListener('click', () => {
      area.querySelector('input[type="file"]')?.click();
    });

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.style.borderColor = 'var(--primary)';
      area.style.background = 'rgba(26,92,56,0.04)';
    });

    area.addEventListener('dragleave', () => {
      area.style.borderColor = '';
      area.style.background = '';
    });

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.style.borderColor = '';
      area.style.background = '';
      const files = e.dataTransfer.files;
      const input = area.querySelector('input[type="file"]');
      if (input && files.length) {
        input.files = files;
        input.dispatchEvent(new Event('change'));
      }
    });
  });

  // ===== SIDEBAR TOGGLE (MOBILE) =====
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  sidebarToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });

  // ===== TABLE SEARCH =====
  const tableSearch = document.getElementById('table-search');
  if (tableSearch) {
    tableSearch.addEventListener('input', function () {
      const query = this.value.toLowerCase();
      document.querySelectorAll('tbody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // ===== AUTO RESIZE TEXTAREA =====
  document.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  });

  // ===== TOAST NOTIFICATION =====
  window.showToast = function (message, type = 'success') {
    const container = document.querySelector('.flash-container') || (() => {
      const c = document.createElement('div');
      c.className = 'flash-container';
      document.body.appendChild(c);
      return c;
    })();

    const flash = document.createElement('div');
    flash.className = `flash flash-${type}`;
    flash.innerHTML = `
      <span>${type === 'success' ? '✓' : '✕'}</span>
      <span class="flash-text">${message}</span>
      <button class="flash-close">×</button>
    `;
    container.appendChild(flash);

    flash.querySelector('.flash-close').addEventListener('click', () => flash.remove());
    setTimeout(() => flash.remove(), 4000);
  };
});
