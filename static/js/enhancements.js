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
    }, { threshold: 0, rootMargin: '0px 0px -80px 0px' });
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

  /* ---------- Hero parallax ---------- */
  function setupParallax() {
    if (prefersReducedMotion) return;
    var hero = document.getElementById('hero');
    if (!hero) return;
    var content = hero.querySelector('.content');
    var image   = hero.querySelector('.image');
    if (!content && !image) return;

    var rafId = null;
    var targetX = 0, targetY = 0;
    var currentX = 0, currentY = 0;

    function loop() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      if (content) content.style.transform = 'translate3d(' + (currentX * -6) + 'px,' + (currentY * -6) + 'px,0)';
      if (image)   image.style.transform   = 'translate3d(' + (currentX * -12) + 'px,' + (currentY * -12) + 'px,0)';
      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    }

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
      if (!rafId) rafId = requestAnimationFrame(loop);
    });
    hero.addEventListener('mouseleave', function () {
      targetX = 0; targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(loop);
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
    setupParallax();
    setupKeyboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
