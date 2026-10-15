const yearEl = document.getElementById('year');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('primary-nav');
const navAnchors = document.querySelectorAll('.nav-links a');
const themeButtons = document.querySelectorAll('.theme-option');
const sectionTargets = document.querySelectorAll('main section[id]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const contactForm = document.getElementById('contact-form');
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const messageField = document.getElementById('message');
const submitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
const formStatus = document.getElementById('form-status');
const cvPath = '/assets/Kavishanth_N_Resume.pdf';
document.querySelectorAll('[data-cv-link]').forEach(link => {
  link.href = cvPath;
  link.setAttribute('download', 'Kavishanth_N_Resume.pdf');
});

const fieldErrorMap = {
  name: document.getElementById('name-error'),
  email: document.getElementById('email-error'),
  message: document.getElementById('message-error')
};

function setFieldError(field, message) {
  const errorEl = fieldErrorMap[field];

  if (errorEl) {
    errorEl.textContent = message || '';
  }

  const input = field === 'name' ? nameField : field === 'email' ? emailField : messageField;
  if (input) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
}

function validateContactForm() {
  const values = {
    name: (nameField ? nameField.value : '').trim(),
    email: (emailField ? emailField.value : '').trim(),
    message: (messageField ? messageField.value : '').trim()
  };

  let isValid = true;

  if (!values.name) {
    setFieldError('name', 'Name is required.');
    isValid = false;
  } else {
    setFieldError('name', '');
  }

  if (!values.email) {
    setFieldError('email', 'Email is required.');
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    setFieldError('email', 'Please enter a valid email address.');
    isValid = false;
  } else {
    setFieldError('email', '');
  }

  if (!values.message) {
    setFieldError('message', 'Message is required.');
    isValid = false;
  } else {
    setFieldError('message', '');
  }

  return isValid;
}

function setFormStatus(message, type) {
  if (!formStatus) return;

  formStatus.textContent = message;
  formStatus.classList.remove('is-success', 'is-error');

  if (type === 'success') {
    formStatus.classList.add('is-success');
  }

  if (type === 'error') {
    formStatus.classList.add('is-error');
  }
}

if (contactForm) {
  [nameField, emailField, messageField].forEach(field => {
    if (!field) return;

    field.addEventListener('input', () => {
      if (field.value.trim()) {
        setFieldError(field.name, '');
      }
      setFormStatus('', '');
    });
  });

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const isValid = validateContactForm();
    if (!isValid || !submitButton) {
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    setFormStatus('', '');

    try {
      const payload = {
        name: nameField.value.trim(),
        email: emailField.value.trim(),
        message: messageField.value.trim()
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong. Please try again.');
      }

      contactForm.reset();
      Object.keys(fieldErrorMap).forEach((key) => setFieldError(key, ''));
      setFormStatus('Thanks! Your message has been sent successfully.', 'success');
      contactForm.classList.add('is-success');
    } catch (error) {
      setFormStatus(error.message || 'Something went wrong. Please try again.', 'error');
      contactForm.classList.remove('is-success');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send Message';
    }
  });
}

function applyTheme(theme) {
  const selectedTheme = theme === 'light' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', selectedTheme);

  themeButtons.forEach(button => {
    const isActive = button.dataset.theme === selectedTheme;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  localStorage.setItem('portfolio-theme', selectedTheme);
}

const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
applyTheme(savedTheme);

if (themeButtons.length) {
  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.theme);
    });
  });
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

function closeMenu() {
  document.body.classList.remove('nav-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
  }
}

function toggleMenu() {
  const isOpen = document.body.classList.toggle('nav-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', toggleMenu);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMenu();
  }
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    closeMenu();
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
    history.pushState(null, '', id);
  });
});

function setActiveNav(id) {
  navAnchors.forEach(anchor => {
    anchor.classList.toggle('active', anchor.getAttribute('href') === `#${id}`);
  });
}

if ('IntersectionObserver' in window && sectionTargets.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveNav(entry.target.id);
      }
    });
  }, {
    rootMargin: '-35% 0px -55% 0px',
    threshold: 0
  });

  sectionTargets.forEach(section => observer.observe(section));
}

window.addEventListener('DOMContentLoaded', () => {
  const initialId = window.location.hash.replace('#', '');
  if (initialId && document.getElementById(initialId)) {
    setActiveNav(initialId);
  } else {
    setActiveNav('');
  }
});

// Scroll-reveal animations using IntersectionObserver
if ('IntersectionObserver' in window) {
  const revealElements = document.querySelectorAll('.section, .project-card, .skill-card, .timeline-item');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15
  });
  
  revealElements.forEach(el => {
    revealObserver.observe(el);
  });
} else {
  // Fallback to instantly show elements if IntersectionObserver is not supported
  document.querySelectorAll('.section, .project-card, .skill-card, .timeline-item').forEach(el => {
    el.classList.add('is-visible');
  });
}

// Subtle navbar elevation on scroll
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const syncHeader = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}

/* ===== Interactive Background Animation ===== */
(function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let animationFrameId = null;
  let particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = ('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(hover: none)').matches);

  const mouse = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    active: false,
    radius: 150
  };

  function getThemeColors() {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    return {
      isLight,
      particle: isLight ? 'rgba(37, 99, 235, 0.45)' : 'rgba(96, 165, 250, 0.55)',
      particleGlow: isLight ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.35)',
      line: isLight ? 'rgba(37, 99, 235, 0.12)' : 'rgba(96, 165, 250, 0.16)',
      mouseLine: isLight ? 'rgba(37, 99, 235, 0.22)' : 'rgba(96, 165, 250, 0.28)',
      cursorGlowInner: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.16)',
      cursorGlowOuter: 'rgba(37, 99, 235, 0)'
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    createParticles();
  }

  function createParticles() {
    particles = [];
    const area = width * height;
    const baseDensity = isTouchDevice ? 32000 : 18000;
    const count = Math.min(Math.max(Math.floor(area / baseDensity), 18), isTouchDevice ? 25 : 70);

    for (let i = 0; i < count; i++) {
      const radius = 1.2 + Math.random() * 1.6;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: radius,
        baseAlpha: 0.2 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02
      });
    }
  }

  function updateParticle(p) {
    if (isReducedMotion) return;

    p.phase += p.pulseSpeed;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) { p.x = 0; p.vx *= -1; }
    if (p.x > width) { p.x = width; p.vx *= -1; }
    if (p.y < 0) { p.y = 0; p.vy *= -1; }
    if (p.y > height) { p.y = height; p.vy *= -1; }

    if (mouse.active && !isTouchDevice) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist < mouse.radius && dist > 0) {
        const force = (1 - dist / mouse.radius);
        const pushX = (dx / dist) * force * 1.8;
        const pushY = (dy / dist) * force * 1.8;

        p.x += pushX;
        p.y += pushY;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    if (mouse.active && !isTouchDevice) {
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;
    }

    const colors = getThemeColors();

    if (mouse.active && !isTouchDevice && mouse.x > 0 && mouse.y > 0) {
      const glowGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, mouse.radius * 1.2
      );
      glowGrad.addColorStop(0, colors.cursorGlowInner);
      glowGrad.addColorStop(1, colors.cursorGlowOuter);

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.radius * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const maxConnectDist = isTouchDevice ? 100 : 130;
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxConnectDist) {
          const alpha = (1 - dist / maxConnectDist) * (colors.isLight ? 0.15 : 0.22);
          ctx.strokeStyle = colors.line.replace(/[\d\.]+\)$/, `${alpha.toFixed(3)})`);
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      if (mouse.active && !isTouchDevice) {
        const mdx = p1.x - mouse.x;
        const mdy = p1.y - mouse.y;
        const mdist = Math.hypot(mdx, mdy);

        if (mdist < mouse.radius) {
          const mAlpha = (1 - mdist / mouse.radius) * (colors.isLight ? 0.22 : 0.32);
          ctx.strokeStyle = colors.mouseLine.replace(/[\d\.]+\)$/, `${mAlpha.toFixed(3)})`);
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      updateParticle(p);

      const pulsingAlpha = Math.min(1, Math.max(0.1, p.baseAlpha + Math.sin(p.phase) * 0.12));

      ctx.fillStyle = colors.particleGlow.replace(/[\d\.]+\)$/, `${(pulsingAlpha * 0.3).toFixed(3)})`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.particle.replace(/[\d\.]+\)$/, `${pulsingAlpha.toFixed(3)})`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    render();
    if (!isReducedMotion) {
      animationFrameId = requestAnimationFrame(loop);
    }
  }

  window.addEventListener('resize', resize, { passive: true });

  if (!isTouchDevice) {
    window.addEventListener('mousemove', (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      mouse.active = false;
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else if (!isReducedMotion) {
      loop();
    }
  });

  resize();
  loop();
})();
