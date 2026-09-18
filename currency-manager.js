/**
 * NeuroPath Global Currency Manager
 * Provides global, reactive dynamic currency switching between US Dollar (USD $) and Nigerian Naira (NGN ₦),
 * with localStorage persistence, cross-tab synchronization, and automatic DOM translation.
 */
(function(window) {
  'use strict';

  const STORAGE_KEY = 'neuropath_currency';
  const DEFAULT_CURRENCY = 'USD';

  // Standard conversion configuration:
  // Base currency is USD ($1.00 = ₦1,600.00 NGN)
  const CURRENCIES = {
    USD: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      rate: 1.0,
      decimals: 2,
      locale: 'en-US'
    },
    NGN: {
      code: 'NGN',
      symbol: '₦',
      name: 'Nigerian Naira',
      rate: 1600.0,
      decimals: 2,
      locale: 'en-NG'
    }
  };

  function getSavedCurrency() {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      if (val && CURRENCIES[val]) {
        return val;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for currency:', e);
    }
    return DEFAULT_CURRENCY;
  }

  let activeCurrency = getSavedCurrency();

  function setCurrency(currCode) {
    if (!CURRENCIES[currCode]) return;
    activeCurrency = currCode;
    try {
      localStorage.setItem(STORAGE_KEY, currCode);
    } catch (e) {}

    // Dispatch global custom event
    const eventDetail = {
      currency: currCode,
      symbol: CURRENCIES[currCode].symbol,
      rate: CURRENCIES[currCode].rate,
      name: CURRENCIES[currCode].name
    };
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: eventDetail }));

    // Update DOM
    updateDOM();
  }

  function getCurrency() {
    return activeCurrency;
  }

  function getCurrencyConfig() {
    return CURRENCIES[activeCurrency] || CURRENCIES.USD;
  }

  /**
   * Convert USD base amount to current active currency formatted string
   * @param {number|string} amountUsd Base amount in USD
   * @param {object} [opts] Formatting options
   * @returns {string} e.g. "$24.00" or "₦38,400.00"
   */
  function formatPrice(amountUsd, opts = {}) {
    const num = parseFloat(amountUsd);
    if (isNaN(num)) return amountUsd;

    const curr = CURRENCIES[activeCurrency] || CURRENCIES.USD;
    const converted = num * curr.rate;

    let decimals = curr.decimals;
    if (opts.decimals !== undefined) {
      decimals = opts.decimals;
    } else if (opts.autoDecimals && converted % 1 === 0) {
      decimals = 0;
    }

    const formattedNumber = converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return `${curr.symbol}${formattedNumber}`;
  }

  /**
   * Render or update all currency toggle widgets in the page
   */
  function updateToggleUI() {
    const toggleButtons = document.querySelectorAll('.curr-toggle-btn');
    toggleButtons.forEach(btn => {
      const btnCurr = btn.getAttribute('data-currency');
      if (btnCurr === activeCurrency) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Also update any select or radio controls if present (e.g. in settings)
    const selects = document.querySelectorAll('.global-currency-select');
    selects.forEach(select => {
      if (select.value !== activeCurrency) {
        select.value = activeCurrency;
      }
    });

    const currIndicators = document.querySelectorAll('.active-currency-code');
    currIndicators.forEach(el => {
      el.textContent = activeCurrency;
    });

    const symbolIndicators = document.querySelectorAll('.active-currency-symbol');
    symbolIndicators.forEach(el => {
      el.textContent = CURRENCIES[activeCurrency].symbol;
    });

    const rateDisplays = document.querySelectorAll('.currency-rate-info');
    rateDisplays.forEach(el => {
      if (activeCurrency === 'NGN') {
        el.textContent = 'Exchange Rate: 1 USD ($) = ₦1,600 NGN';
      } else {
        el.textContent = 'Base Currency: US Dollar ($ USD)';
      }
    });
  }

  /**
   * Scan DOM and update all elements marked with data-amount-usd
   */
  function updatePriceElements() {
    const elements = document.querySelectorAll('[data-amount-usd]');
    elements.forEach(el => {
      const baseUsd = el.getAttribute('data-amount-usd');
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const decimalsAttr = el.getAttribute('data-decimals');
      const decimals = decimalsAttr !== null ? parseInt(decimalsAttr, 10) : undefined;
      const autoDecimals = el.getAttribute('data-auto-decimals') === 'true';

      const formatted = formatPrice(baseUsd, { decimals, autoDecimals });
      el.textContent = `${prefix}${formatted}${suffix}`;
    });
  }

  function updateDOM() {
    updateToggleUI();
    updatePriceElements();
  }

  /**
   * Create and inject the switcher markup into .header-actions if not present
   */
  function initHeaderSwitcher() {
    const headers = document.querySelectorAll('.header-actions');
    headers.forEach(headerActions => {
      if (!headerActions.querySelector('.currency-switch-global')) {
        const switcher = document.createElement('div');
        switcher.className = 'currency-switch-global';
        switcher.id = 'headerCurrencySwitch';
        switcher.title = 'Switch display currency (Naira ₦ / Dollar $)';
        switcher.setAttribute('role', 'group');
        switcher.setAttribute('aria-label', 'Currency selector');
        switcher.innerHTML = `
          <button type="button" class="curr-toggle-btn ${activeCurrency === 'USD' ? 'active' : ''}" data-currency="USD" aria-label="Switch to US Dollar ($)" aria-pressed="${activeCurrency === 'USD'}">
            <span class="curr-symbol">$</span>
            <span class="curr-code">USD</span>
          </button>
          <button type="button" class="curr-toggle-btn ${activeCurrency === 'NGN' ? 'active' : ''}" data-currency="NGN" aria-label="Switch to Nigerian Naira (₦)" aria-pressed="${activeCurrency === 'NGN'}">
            <span class="curr-symbol">₦</span>
            <span class="curr-code">NGN</span>
          </button>
        `;

        // Insert before profile pill, or append
        const profilePill = headerActions.querySelector('.profile-pill');
        if (profilePill) {
          headerActions.insertBefore(switcher, profilePill);
        } else {
          headerActions.appendChild(switcher);
        }
      }
    });
  }

  function setupEventListeners() {
    // Delegated click listener for any currency toggle buttons
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.curr-toggle-btn');
      if (btn) {
        const targetCurr = btn.getAttribute('data-currency');
        if (targetCurr && targetCurr !== activeCurrency) {
          setCurrency(targetCurr);
        }
      }
    });

    // Cross-tab storage change sync
    window.addEventListener('storage', function(e) {
      if (e.key === STORAGE_KEY && e.newValue && CURRENCIES[e.newValue]) {
        if (e.newValue !== activeCurrency) {
          activeCurrency = e.newValue;
          window.dispatchEvent(new CustomEvent('currencyChange', {
            detail: {
              currency: activeCurrency,
              symbol: CURRENCIES[activeCurrency].symbol,
              rate: CURRENCIES[activeCurrency].rate,
              name: CURRENCIES[activeCurrency].name
            }
          }));
          updateDOM();
        }
      }
    });
  }

  // Initialize on load
  function init() {
    activeCurrency = getSavedCurrency();
    initHeaderSwitcher();
    setupEventListeners();
    updateDOM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export to global scope
  window.CurrencyManager = {
    getCurrency,
    setCurrency,
    formatPrice,
    getCurrencyConfig,
    currencies: CURRENCIES,
    updateDOM
  };

})(window);
