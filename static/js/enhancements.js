(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal ---------- */
  function setupReveal() {
    var bypass = location.search.indexOf('noreveal') >= 0;
    var targets = document.querySelectorAll(
      '#about, #experience, #education, #projects, #achievements, #contact, ' +
      '.homelab-band, .currently-strip'
    );
    if (bypass || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add('reveal', 'is-visible');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add('reveal');
      io.observe(el);
      // Immediate-reveal fallback: if already above-fold at load, reveal now.
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        el.classList.add('is-visible');
        io.unobserve(el);
      }
    });
  }

  /* ---------- Keyboard shortcuts ---------- */
  function setupKeyboard() {
    var sections = {
      h: 'hero', a: 'about', e: 'experience',
      d: 'education', p: 'projects', r: 'achievements', c: 'contact'
    };
    var gPressed = false;
    var gTimer = null;
    var modal = document.querySelector('.kb-help');
    var hintPill = document.querySelector('.kb-hint-pill');

    function openModal() {
      if (!modal) return;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }
    function closeModal() {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }

    if (hintPill && !sessionStorage.getItem('kb-hint-seen')) {
      setTimeout(function () {
        hintPill.classList.add('is-visible');
        setTimeout(function () {
          hintPill.classList.remove('is-visible');
        }, 4500);
        sessionStorage.setItem('kb-hint-seen', '1');
      }, 2800);
    }

    document.addEventListener('keydown', function (e) {
      var t = document.activeElement.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || document.activeElement.isContentEditable) return;

      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        if (modal && modal.classList.contains('is-open')) closeModal();
        else openModal();
        e.preventDefault();
        return;
      }
      if (e.key === 'g') {
        gPressed = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(function () { gPressed = false; }, 900);
        return;
      }
      if (gPressed && sections[e.key]) {
        gPressed = false;
        if (gTimer) clearTimeout(gTimer);
        var target = document.getElementById(sections[e.key]);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        e.preventDefault();
      }
    });

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }
  }

  function init() {
    setupReveal();
    setupKeyboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
