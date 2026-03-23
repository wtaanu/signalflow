(function () {
  'use strict';

  const BUTTON_ID = 'signalflow-fab';

  function isProfilePage() {
    return /linkedin\.com\/in\/[^/]+/.test(window.location.href);
  }

  function scrapeProfile() {
    const name = document.querySelector('h1')?.textContent?.trim() || '';

    // Title: first substantial text sibling/cousin after h1
    let title = '';
    const h1 = document.querySelector('h1');
    if (h1) {
      let el = h1.nextElementSibling;
      for (let i = 0; i < 5 && el; i++) {
        const t = el.textContent?.trim();
        if (t && t.length > 3 && t.length < 200) { title = t; break; }
        el = el.nextElementSibling;
      }
    }
    if (!title) title = document.querySelector('.text-body-medium')?.textContent?.trim() || '';

    // About section
    let about_text = '';
    const aboutAnchor = document.getElementById('about');
    if (aboutAnchor) {
      const section = aboutAnchor.closest('section') ||
                      aboutAnchor.parentElement?.closest('section');
      if (section) {
        about_text = section.querySelector('span[aria-hidden="true"]')?.textContent?.trim() || '';
      }
    }
    if (!about_text) {
      // Walk all sections, find one whose heading text is "About"
      for (const section of document.querySelectorAll('section')) {
        const heading = section.querySelector('h2');
        if (heading && heading.textContent.trim().toLowerCase() === 'about') {
          about_text = section.querySelector('span[aria-hidden="true"]')?.textContent?.trim() || '';
          break;
        }
      }
    }

    const profile_url = window.location.href.split('?')[0].replace(/\/$/, '');
    return { name, title, profile_url, about_text };
  }

  function createFAB() {
    if (document.getElementById(BUTTON_ID)) return;
    if (!isProfilePage()) return;

    const fab = document.createElement('div');
    fab.id = BUTTON_ID;
    fab.style.cssText = [
      'position:fixed',
      'bottom:28px',
      'right:28px',
      'z-index:2147483647',
      'display:flex',
      'flex-direction:column',
      'align-items:flex-end',
      'gap:8px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    ].join(';');

    const btn = document.createElement('button');
    btn.textContent = '✨ Save to SignalFlow';
    btn.style.cssText = [
      'background:linear-gradient(135deg,#6366f1,#8b5cf6)',
      'color:#fff',
      'border:none',
      'border-radius:24px',
      'padding:11px 24px',
      'font-size:14px',
      'font-weight:700',
      'cursor:pointer',
      'display:inline-flex',
      'align-items:center',
      'gap:7px',
      'box-shadow:0 4px 20px rgba(99,102,241,0.55)',
      'transition:transform 0.15s,opacity 0.15s',
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      'white-space:nowrap',
      'letter-spacing:0.01em',
    ].join(';');

    const toast = document.createElement('div');
    toast.style.cssText = [
      'background:rgba(17,17,17,0.92)',
      'color:#fff',
      'font-size:12px',
      'font-weight:500',
      'padding:6px 14px',
      'border-radius:12px',
      'pointer-events:none',
      'display:none',
      'max-width:260px',
      'text-align:right',
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    ].join(';');

    function showToast(msg, color) {
      toast.textContent = msg;
      toast.style.display = 'block';
      toast.style.color = color || '#fff';
      clearTimeout(toast._t);
      toast._t = setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }

    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.04)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('mousedown', () => btn.style.opacity = '0.8');
    btn.addEventListener('mouseup', () => btn.style.opacity = '1');

    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.textContent = '⏳ Saving...';

      const profile = scrapeProfile();

      if (!profile.name) {
        btn.disabled = false;
        btn.textContent = '✨ Save to SignalFlow';
        showToast('⚠️ Could not read name. Try scrolling down first.', '#fbbf24');
        return;
      }

      chrome.storage.sync.get(['apiKey', 'apiUrl'], async (config) => {
        const apiKey = (config.apiKey || '').trim();
        const apiUrl = (config.apiUrl || '').trim();

        if (!apiKey || !apiUrl) {
          btn.disabled = false;
          btn.textContent = '✨ Save to SignalFlow';
          showToast('⚙️ Click the extension icon and set your API URL & key.', '#fbbf24');
          return;
        }

        try {
          const res = await fetch(apiUrl.replace(/\/$/, '') + '/api/save-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify(profile),
          });

          if (res.ok) {
            btn.textContent = '✅ Saved!';
            showToast(`${profile.name} saved to SignalFlow`, '#4ade80');
            setTimeout(() => {
              btn.disabled = false;
              btn.textContent = '✨ Save to SignalFlow';
            }, 3000);
          } else {
            const err = await res.json().catch(() => ({ error: 'Server error' }));
            btn.disabled = false;
            btn.textContent = '✨ Save to SignalFlow';
            showToast('❌ ' + (err.error || 'Failed to save.'), '#f87171');
          }
        } catch {
          btn.disabled = false;
          btn.textContent = '✨ Save to SignalFlow';
          showToast('❌ Network error — check your API URL.', '#f87171');
        }
      });
    });

    fab.appendChild(toast);
    fab.appendChild(btn);
    document.body.appendChild(fab);
  }

  function removeFAB() {
    const el = document.getElementById(BUTTON_ID);
    if (el) el.remove();
  }

  // Show on profile pages, hide on others
  function syncFAB() {
    if (isProfilePage()) createFAB();
    else removeFAB();
  }

  // Wait for body then inject
  if (document.body) {
    syncFAB();
  } else {
    document.addEventListener('DOMContentLoaded', syncFAB);
  }

  // Handle LinkedIn SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      removeFAB();
      setTimeout(syncFAB, 1200);
    }
  }).observe(document.documentElement, { subtree: true, childList: true });

})();
