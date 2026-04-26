'use strict';

// ===== HEADER: scroll state =====
(function () {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ===== MOBILE MENU =====
(function () {
  const burger = document.getElementById('burger');
  const overlay = document.getElementById('mobileOverlay');
  if (!burger || !overlay) return;

  const close = () => {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  burger.addEventListener('click', () => {
    const isOpen = overlay.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// ===== SCROLL ANIMATIONS =====
(function () {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach(el => io.observe(el));
})();

// ===== COUNTER ANIMATION for metrics =====
(function () {
  const metrics = document.querySelectorAll('.metric__value[data-target]');
  if (!metrics.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = target * easeOut(progress);
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target); io.unobserve(e.target); }
    }),
    { threshold: 0.3 }
  );
  metrics.forEach(el => io.observe(el));
})();

// ===== FAQ ACCORDION =====
(function () {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      // Close all
      items.forEach(i => {
        const b = i.querySelector('.faq-question');
        const a = i.querySelector('.faq-answer');
        if (b && a) { b.setAttribute('aria-expanded', 'false'); a.style.maxHeight = '0'; }
      });
      // Toggle current
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
})();

// ===== CONTACT FORM =====
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const nameInput   = document.getElementById('name');
  const emailInput  = document.getElementById('email');
  const descInput   = document.getElementById('description');
  const submitBtn   = document.getElementById('submitBtn');
  const successMsg  = document.getElementById('formSuccess');
  const errorMsg    = document.getElementById('formErrorGlobal');
  const nameErr     = document.getElementById('nameError');
  const emailErr    = document.getElementById('emailError');

  const showError = (input, errEl, msg) => {
    input.classList.add('error');
    errEl.textContent = msg;
    errEl.classList.add('visible');
  };
  const clearError = (input, errEl) => {
    input.classList.remove('error');
    errEl.textContent = '';
    errEl.classList.remove('visible');
  };
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    let ok = true;
    clearError(nameInput, nameErr);
    clearError(emailInput, emailErr);

    if (!nameInput.value.trim()) {
      showError(nameInput, nameErr, 'Введите имя'); ok = false;
    }
    if (!emailInput.value.trim()) {
      showError(emailInput, emailErr, 'Введите email'); ok = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      showError(emailInput, emailErr, 'Неверный формат email'); ok = false;
    }
    return ok;
  };

  // Inline validation on blur
  nameInput.addEventListener('blur', () => {
    if (nameInput.value.trim()) clearError(nameInput, nameErr);
    else showError(nameInput, nameErr, 'Введите имя');
  });
  emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim()) showError(emailInput, emailErr, 'Введите email');
    else if (!isValidEmail(emailInput.value.trim())) showError(emailInput, emailErr, 'Неверный формат email');
    else clearError(emailInput, emailErr);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    successMsg.hidden = true;
    errorMsg.hidden = true;

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      description: descInput ? descInput.value.trim() : '',
    };

    try {
      const res = await fetch('https://api.entrypoint.davidishe.pro/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.querySelector('.btn-text').textContent = 'Отправлено ✓';
        form.reset();
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Reset button after 4s
        setTimeout(() => {
          submitBtn.classList.remove('success');
          submitBtn.querySelector('.btn-text').textContent = 'Запросить расчёт';
          submitBtn.disabled = false;
        }, 4000);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      errorMsg.hidden = false;
    }
  });
})();

// ===== SMOOTH SCROLL for anchor links =====
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const headerH = document.getElementById('header')?.offsetHeight || 70;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
