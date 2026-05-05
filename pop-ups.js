(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────────── */
  var YEARLY_FORM_SRC = 'https://link.systemisedtoscale.com/widget/form/mTrO4x8xyKnbUjgPIYxC';
  var WHATSAPP_URL    = 'https://docs.systemisedtoscale.com/supercharge-crm/whatsapp-bolt-on';
  var SHOW_FROM_DAY   = 4;    // only show on or after the 4th of each month
  var DELAY_MS        = 4000; // ms after page load before popup fires
  var STORAGE_KEY     = 'sts_upsell_v2';

  /* ── COPY VARIANTS ──────────────────────────────────────── */

  var YEARLY_VARIANTS = [
    {
      badge:    'You\'re already here',
      headline: 'You\'re already using our platform.\nYou may as well pay 15% less.',
      body:     'Same CRM. Same automations. Same everything. Just a lower price. Switch to yearly and stop paying the monthly rate for no reason.',
      cta:      'Pay less, simple',
    },
    {
      badge:    'Quick maths',
      headline: 'One payment.\n15% off your current rate.',
      body:     'That\'s the only difference between monthly and yearly. Same platform, same support, same systems. Just a lower price for paying annually. It\'s a straightforward swap.',
      cta:      'Switch to yearly',
    },
    {
      badge:    'Simplest upgrade you\'ll make',
      headline: 'Pay once.\nSorted for a year.',
      body:     'Pay once, covered for the year, nothing to revisit. Yearly billing costs less than monthly and removes any admin around it entirely.',
      cta:      'Lock it in',
    },
    {
      badge:    '15% off your current rate',
      headline: 'Yearly billing costs less\nthan what you\'re paying now.',
      body:     'Switch from monthly to yearly and you save 15% on your current rate. Same platform, same everything. One switch and the saving applies every year from here.',
      cta:      'Switch and save 15%',
    },
    {
      badge:    'Built for the long game',
      headline: 'You\'re building something long term.\nThe price should reflect that.',
      body:     'Monthly billing made sense to get started. You\'re started. Yearly costs less, locks in your rate, and that\'s the end of it. Make the switch.',
      cta:      'Upgrade to yearly',
    },
  ];

  var WHATSAPP_VARIANTS = [
    {
      badge:    '70% higher engagement than SMS',
      headline: 'Same messages.\nWhatsApp gets 70% more replies.',
      body:     'Businesses switching from SMS to WhatsApp report 70% higher engagement on the same sequences. Same CRM. Same automations. We handle the integration for you with zero setup on your end.',
      cta:      'Add WhatsApp to my account',
    },
    {
      badge:    '156% more conversions',
      headline: 'Your sequences are running.\nWhatsApp makes them convert quicker.',
      body:     'Businesses that switch from SMS to WhatsApp see a 156% increase in conversion rates on the same workflows, same sequences, same CRM. We handle the full integration so there\'s nothing on your end to set up.',
      cta:      'Switch to WhatsApp messaging',
    },
    {
      badge:    'We handle everything',
      headline: 'You do nothing.\nWe connect your WhatsApp. It just works.',
      body:     'No new number. No new platform. Your current WhatsApp connected directly to your CRM, every reply landing in your Inbox, every contact saved automatically. We set the whole thing up for you.',
      cta:      'Get WhatsApp connected',
    },
    {
      badge:    'Your leads are already on it',
      headline: 'Your leads are on WhatsApp all day.\nYour messages are going to texts.',
      body:     'WhatsApp is where your leads are spending their time and where they actually respond. Switching your sequences to WhatsApp means more conversations and more conversions from the same automations you\'ve already built. We handle the integration and it\'s live instantly.',
      cta:      'Move my messages to WhatsApp',
    },
    {
      badge:    'Instant setup, we do it all',
      headline: 'Better replies. More conversions.\nZero work on your side.',
      body:     'We connect your current WhatsApp number to your CRM and your existing automations start running through WhatsApp. Businesses making this switch see 70% higher engagement from the same sequences, and we handle everything from start to finish.',
      cta:      'Add the WhatsApp bolt-on',
    },
  ];

  /* ── STATE HELPERS ──────────────────────────────────────── */

  function getState () {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function saveState (state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function getMonthKey () {
    var now = new Date();
    return now.getFullYear() + '-' + (now.getMonth() + 1);
  }

  function getCurrentOffer () {
    // ODD months = yearly, EVEN months = whatsapp
    var month = new Date().getMonth() + 1;
    return month % 2 !== 0 ? 'yearly' : 'whatsapp';
  }

  function getNextMonthKey () {
    var now  = new Date();
    var y    = now.getFullYear();
    var m    = now.getMonth() + 2; // next month (1-indexed)
    if (m > 12) { m = 1; y += 1; }
    return y + '-' + m;
  }

  function shouldShow () {
    var now      = new Date();
    var today    = now.getDate();

    // Gate: only show on or after SHOW_FROM_DAY of the month
    if (today < SHOW_FROM_DAY) return false;

    var state    = getState();
    var monthKey = getMonthKey();
    var offerKey = getCurrentOffer() + '_' + monthKey;
    var entry    = state[offerKey];

    // Never seen this offer this month — show it
    if (!entry) return true;

    // Was closed this month — don't show again until next month's 4th
    if (entry.closedAt) return false;

    return false;
  }

  function markClosed () {
    var state    = getState();
    var monthKey = getMonthKey();
    var offerKey = getCurrentOffer() + '_' + monthKey;
    var existing = state[offerKey] || {};
    state[offerKey] = Object.assign({}, existing, { closedAt: Date.now() });
    saveState(state);
  }

  function getVariantIndex () {
    var state    = getState();
    var monthKey = getMonthKey();
    var offerKey = getCurrentOffer() + '_' + monthKey;

    if (state[offerKey] && typeof state[offerKey].variant === 'number') {
      return state[offerKey].variant;
    }

    // Pick a random variant for this month and lock it in
    var idx   = Math.floor(Math.random() * 5);
    var entry = state[offerKey] || {};
    state[offerKey] = Object.assign({}, entry, { variant: idx });
    saveState(state);
    return idx;
  }

  /* ── STYLES ─────────────────────────────────────────────── */

  function injectStyles () {
    if (document.getElementById('sts-popup-styles')) return;

    var css = [
      '#sts-popup-overlay{',
        'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:999998;',
        'display:flex;align-items:center;justify-content:center;padding:16px;',
        'animation:stsFadeIn 0.25s ease;',
      '}',
      '#sts-popup-box{',
        'background:#fff;border-radius:16px;max-width:480px;width:100%;',
        'padding:36px 32px 28px;position:relative;',
        'box-shadow:0 24px 64px rgba(0,0,0,0.18);',
        'animation:stsSlideUp 0.3s ease;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
      '}',
      '#sts-popup-box.sts-whatsapp{border-top:4px solid #25D366;}',
      '#sts-popup-box.sts-yearly{border-top:4px solid #38bdf8;}',
      '#sts-popup-close{',
        'position:absolute;top:14px;right:16px;background:none;border:none;',
        'cursor:pointer;font-size:22px;color:#999;line-height:1;padding:4px 8px;',
        'border-radius:6px;transition:background 0.15s,color 0.15s;',
      '}',
      '#sts-popup-close:hover{background:#f0f0f0;color:#333;}',
      '#sts-popup-badge{',
        'display:inline-block;font-size:11px;font-weight:700;',
        'letter-spacing:0.08em;text-transform:uppercase;',
        'padding:4px 10px;border-radius:100px;margin-bottom:14px;',
      '}',
      '.sts-whatsapp #sts-popup-badge{background:#e8faf0;color:#1a9e4f;}',
      '.sts-yearly #sts-popup-badge{background:#e0f5fe;color:#0284c7;}',
      '#sts-popup-headline{',
        'font-size:20px;font-weight:700;color:#111;line-height:1.35;',
        'margin:0 0 12px;white-space:pre-line;',
      '}',
      '#sts-popup-body{font-size:14px;color:#555;line-height:1.65;margin:0 0 24px;}',
      '#sts-popup-cta{',
        'display:block;width:100%;padding:14px 20px;border:none;border-radius:10px;',
        'font-size:15px;font-weight:600;cursor:pointer;text-align:center;',
        'text-decoration:none;transition:opacity 0.15s,transform 0.1s;',
        'box-sizing:border-box;',
      '}',
      '#sts-popup-cta:hover{opacity:0.9;transform:translateY(-1px);}',
      '.sts-whatsapp #sts-popup-cta{background:#25D366;color:#fff;}',
      '#sts-popup-dismiss{',
        'display:block;width:100%;margin-top:10px;background:none;border:none;',
        'cursor:pointer;font-size:12px;color:#bbb;text-align:center;',
        'padding:6px;transition:color 0.15s;',
      '}',
      '#sts-popup-dismiss:hover{color:#888;}',
      '#sts-yearly-iframe-wrap{display:none;margin-top:8px;}',
      '#sts-yearly-iframe-wrap iframe{width:100%;min-height:340px;border:none;border-radius:8px;}',
      '@keyframes stsFadeIn{from{opacity:0}to{opacity:1}}',
      '@keyframes stsSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}',
      '@media(max-width:520px){',
        '#sts-popup-box{padding:28px 20px 22px;}',
        '#sts-popup-headline{font-size:18px;}',
      '}',
    ].join('');

    var tag     = document.createElement('style');
    tag.id        = 'sts-popup-styles';
    tag.innerHTML = css;
    document.head.appendChild(tag);
  }

  /* ── BUILD POPUP ────────────────────────────────────────── */

  function buildPopup (offer, variant) {
    var isYearly = offer === 'yearly';
    var v        = isYearly ? YEARLY_VARIANTS[variant] : WHATSAPP_VARIANTS[variant];

    var overlay = document.createElement('div');
    overlay.id  = 'sts-popup-overlay';

    var box       = document.createElement('div');
    box.id        = 'sts-popup-box';
    box.className = isYearly ? 'sts-yearly' : 'sts-whatsapp';

    var closeBtn           = document.createElement('button');
    closeBtn.id            = 'sts-popup-close';
    closeBtn.innerHTML     = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');

    var badge         = document.createElement('div');
    badge.id          = 'sts-popup-badge';
    badge.textContent = v.badge;

    var headline         = document.createElement('h2');
    headline.id          = 'sts-popup-headline';
    headline.textContent = v.headline;

    var bodyP         = document.createElement('p');
    bodyP.id          = 'sts-popup-body';
    bodyP.textContent = v.body;

    var dismiss         = document.createElement('button');
    dismiss.id          = 'sts-popup-dismiss';
    dismiss.textContent = 'Not right now';

    box.appendChild(closeBtn);
    box.appendChild(badge);
    box.appendChild(headline);
    box.appendChild(bodyP);

    if (isYearly) {
      var iframeWrap  = document.createElement('div');
      iframeWrap.id   = 'sts-yearly-iframe-wrap';
      iframeWrap.style.display = 'block';

      var iframe = document.createElement('iframe');
      iframe.src = YEARLY_FORM_SRC;
      iframe.setAttribute('id',             'ghl-yearly-form-iframe');
      iframe.setAttribute('data-form-id',   'mTrO4x8xyKnbUjgPIYxC');
      iframe.setAttribute('data-form-name', 'Yearly upsell form');
      iframe.setAttribute('title',          'Yearly upsell form');

      iframeWrap.appendChild(iframe);
      box.appendChild(iframeWrap);

    } else {
      var ctaLink   = document.createElement('a');
      ctaLink.id    = 'sts-popup-cta';
      ctaLink.textContent = v.cta;
      ctaLink.href  = WHATSAPP_URL;
      ctaLink.target = '_blank';
      ctaLink.rel   = 'noopener noreferrer';
      box.appendChild(ctaLink);
    }

    box.appendChild(dismiss);
    overlay.appendChild(box);

    /* Close logic */
    function closePopup () {
      markClosed();
      overlay.style.animation = 'stsFadeIn 0.2s ease reverse forwards';
      box.style.animation     = 'stsSlideUp 0.2s ease reverse forwards';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 220);
    }

    closeBtn.addEventListener('click', closePopup);
    dismiss.addEventListener('click',  closePopup);
    overlay.addEventListener('click',  function (e) {
      if (e.target === overlay) closePopup();
    });

    document.addEventListener('keydown', function escHandler (e) {
      if (e.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', escHandler);
      }
    });

    return overlay;
  }

  /* ── INIT ───────────────────────────────────────────────── */

  function init () {
    if (!shouldShow()) return;

    var offer   = getCurrentOffer();
    var variant = getVariantIndex();

    injectStyles();

    var popup = buildPopup(offer, variant);

    setTimeout(function () {
      document.body.appendChild(popup);
    }, DELAY_MS);
  }

  /* ── GHL SPA-SAFE INIT ──────────────────────────────────── */
  // GHL is a single-page app — DOMContentLoaded can fire before
  // the app shell is fully painted. We wait for document.body to
  // exist, then apply the standard DELAY_MS before showing.

  function waitForBodyThenInit () {
    if (document.body) {
      init();
    } else {
      requestAnimationFrame(waitForBodyThenInit);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForBodyThenInit);
  } else {
    waitForBodyThenInit();
  }

})();
