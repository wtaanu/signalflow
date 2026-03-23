// Hardcoded Google OAuth Client ID (Web Application type)
const GOOGLE_CLIENT_ID = '784395037774-3t96cff37d2krkbdb5utos0pi892e8bb.apps.googleusercontent.com';

document.addEventListener('DOMContentLoaded', async () => {
  const $ = id => document.getElementById(id);

  const apiUrlInput    = $('apiUrl');
  const apiKeyInput    = $('apiKey');
  const btnSave        = $('btnSave');
  const statusMsg      = $('statusMsg');
  const btnGoogle      = $('btnGoogle');
  const btnLogout      = $('btnLogout');
  const btnDashboard   = $('btnDashboard');

  const profileSection = $('profileSection');
  const actionSection  = $('actionSection');
  const loginSection   = $('loginSection');

  const userName       = $('userName');
  const userEmail      = $('userEmail');
  const headerPlanBadge = $('headerPlanBadge');
  const avatarRing     = $('avatarRing');
  const avatarPlaceholder = $('avatarPlaceholder');
  const usageWrap      = $('usageWrap');
  const usageText      = $('usageText');
  const usageFill      = $('usageFill');
  const limitWarn      = $('limitWarn');

  // ── Helpers ──────────────────────────────────────────────

  function showStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = 'status ' + type;
    setTimeout(() => { statusMsg.className = 'status'; }, 3000);
  }

  function planLabel(plan) {
    if (plan === 'monthly') return 'Pro';
    if (plan === 'annual')  return 'Elite';
    return 'Free';
  }

  function isPro(user) {
    return (user.plan === 'monthly' || user.plan === 'annual') &&
           user.plan_expires_at &&
           new Date(user.plan_expires_at) > new Date();
  }

  // ── Render logged-in state ────────────────────────────────

  function renderUser(user) {
    // Name + email
    userName.textContent  = user.name || user.email || 'User';
    userEmail.textContent = user.email || '';

    // Determine tier
    const pro   = user.plan === 'monthly' && user.plan_expires_at && new Date(user.plan_expires_at) > new Date();
    const elite = user.plan === 'annual'  && user.plan_expires_at && new Date(user.plan_expires_at) > new Date();
    const tier  = elite ? 'elite' : pro ? 'pro' : 'free';

    // Profile photo / avatar ring color
    const ringGradients = {
      free:  'linear-gradient(135deg,#6366f1,#8b5cf6)',
      pro:   'linear-gradient(135deg,#6366f1,#8b5cf6)',
      elite: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    };
    avatarRing.style.background = ringGradients[tier];

    if (user.picture) {
      avatarRing.innerHTML = `<img src="${user.picture}" alt="${user.name || ''}" style="width:48px;height:48px;border-radius:50%;display:block;object-fit:cover;" />`;
    } else {
      const initial = (user.name || user.email || '?')[0].toUpperCase();
      avatarRing.innerHTML = `<div style="width:48px;height:48px;border-radius:50%;background:#1e1e2e;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#a5b4fc;">${initial}</div>`;
    }

    // Plan icon badge (overlaid on avatar)
    const planIconBadge = document.getElementById('planIconBadge');
    const badgeData = {
      free:  { icon: '🔘', cls: 'plan-icon-badge free'  },
      pro:   { icon: '⚡', cls: 'plan-icon-badge pro'   },
      elite: { icon: '👑', cls: 'plan-icon-badge elite' },
    };
    planIconBadge.textContent = badgeData[tier].icon;
    planIconBadge.className   = badgeData[tier].cls;

    // Plan badge in header
    const label = planLabel(user.plan);
    headerPlanBadge.textContent = label;
    headerPlanBadge.className = 'plan-badge' + (elite ? ' pro' : '');
    headerPlanBadge.style.display = 'inline-block';

    // Usage bar (free users only)
    if (tier === 'free') {
      const usage = user.monthly_usage || 0;
      const limit = 5;
      const pct   = Math.min((usage / limit) * 100, 100);
      usageText.textContent  = `${usage} / ${limit} saves`;
      usageFill.style.width  = pct + '%';
      usageFill.classList.toggle('warn', pct >= 80);
      usageWrap.style.display = 'block';
      limitWarn.style.display = usage >= limit ? 'block' : 'none';
    } else {
      usageWrap.style.display = 'none';
      limitWarn.style.display = 'none';
    }

    // Show / hide sections
    profileSection.style.display = 'block';
    actionSection.classList.remove('hidden');
    loginSection.style.display = 'none';
  }

  // ── Render logged-out state ───────────────────────────────

  function renderLoggedOut() {
    profileSection.style.display = 'none';
    actionSection.classList.add('hidden');
    loginSection.style.display   = 'block';
    headerPlanBadge.style.display = 'none';
  }

  // ── Fetch current user from API ───────────────────────────

  async function fetchMe(apiUrl, sessionToken) {
    try {
      const res = await fetch(apiUrl.replace(/\/$/, '') + '/api/auth/me', {
        headers: { 'x-session-token': sessionToken },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ── Init: load saved config & restore session ─────────────

  const config = await new Promise(resolve =>
    chrome.storage.sync.get(['apiKey', 'apiUrl', 'sessionToken'], resolve)
  );
  if (config.apiUrl) apiUrlInput.value = config.apiUrl;
  if (config.apiKey) apiKeyInput.value = config.apiKey;

  if (config.sessionToken && config.apiUrl) {
    const user = await fetchMe(config.apiUrl, config.sessionToken);
    if (user) {
      renderUser(user);
    } else {
      chrome.storage.sync.remove('sessionToken');
      renderLoggedOut();
    }
  } else {
    renderLoggedOut();
  }

  // ── Save settings ─────────────────────────────────────────

  btnSave.addEventListener('click', () => {
    const apiUrl = apiUrlInput.value.trim().replace(/\/$/, '');
    const apiKey = apiKeyInput.value.trim();
    if (!apiUrl) { showStatus('Enter your API URL.', 'error'); return; }
    if (!apiKey) { showStatus('Enter your API key.', 'error'); return; }
    chrome.storage.sync.set({ apiUrl, apiKey }, () => {
      showStatus('✓ Settings saved!', 'success');
    });
  });

  // ── Google login ──────────────────────────────────────────

  btnGoogle.addEventListener('click', async () => {
    const { apiUrl, apiKey } = await new Promise(r =>
      chrome.storage.sync.get(['apiUrl', 'apiKey'], r)
    );
    const base = (apiUrlInput.value.trim() || apiUrl || '').replace(/\/$/, '');
    const key  = apiKeyInput.value.trim() || apiKey || '';

    if (!base) { showStatus('Save your API URL first.', 'error'); return; }

    const originalHtml = btnGoogle.innerHTML;
    btnGoogle.innerHTML = 'Connecting to Google…';
    btnGoogle.disabled  = true;

    try {
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id',     GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri',  redirectUri);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope',         'openid email profile');
      authUrl.searchParams.set('prompt',        'select_account');

      const redirectUrl = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          { url: authUrl.toString(), interactive: true },
          url => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(url);
          }
        );
      });

      const params      = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
      const accessToken = params.get('access_token');
      if (!accessToken) throw new Error('No access token received');

      const res = await fetch(base + '/api/auth/google/token', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'x-api-key':     key,
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!res.ok) throw new Error('Server authentication failed');
      const data = await res.json();

      chrome.storage.sync.set({ sessionToken: data.session_token }, () => {
        renderUser(data.user);
        showStatus('✓ Signed in!', 'success');
      });
    } catch (err) {
      showStatus('Login failed: ' + (err.message || 'unknown error'), 'error');
    } finally {
      btnGoogle.innerHTML = originalHtml;
      btnGoogle.disabled  = false;
    }
  });

  // ── Sign out ──────────────────────────────────────────────

  btnLogout.addEventListener('click', async () => {
    const { sessionToken, apiUrl } = await new Promise(r =>
      chrome.storage.sync.get(['sessionToken', 'apiUrl'], r)
    );
    if (sessionToken && apiUrl) {
      fetch(apiUrl.replace(/\/$/, '') + '/api/auth/logout', {
        method: 'POST',
        headers: { 'x-session-token': sessionToken },
      }).catch(() => {});
    }
    chrome.storage.sync.remove('sessionToken', () => {
      renderLoggedOut();
      showStatus('Signed out.', 'success');
    });
  });

  // ── Open dashboard ────────────────────────────────────────

  btnDashboard.addEventListener('click', async () => {
    const { apiUrl } = await new Promise(r => chrome.storage.sync.get('apiUrl', r));
    if (apiUrl) chrome.tabs.create({ url: apiUrl.replace(/\/$/, '') });
  });
});
