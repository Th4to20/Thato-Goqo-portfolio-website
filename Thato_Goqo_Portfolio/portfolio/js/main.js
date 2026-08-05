/* ============================================
   Thato Goqo — Portfolio JS
   Vanilla JS, no build tools.
   ============================================ */

// ----- page loader -----
const pageLoader = document.getElementById('page-loader');

if (pageLoader) {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const minDisplay = reducedMotionQuery.matches ? 0 : 400; // avoid a jarring flash on fast loads
  const shownAt = performance.now();

  function hideLoader() {
    const elapsed = performance.now() - shownAt;
    const wait = Math.max(minDisplay - elapsed, 0);
    setTimeout(() => pageLoader.classList.add('hidden'), wait);
  }

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }

  // safety net in case a slow asset (e.g. Three.js) never fires 'load'
  setTimeout(() => pageLoader.classList.add('hidden'), 3000);
}

// ----- mobile nav toggle -----
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // close menu when a link is clicked (mobile)
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

// ----- highlight current page in nav -----
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach((link) => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// ----- scroll reveal animation -----
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  // fallback: just show everything
  revealEls.forEach((el) => el.classList.add('visible'));
}

// ----- footer year -----
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ----- hero terminal typewriter (home page only) -----
const terminalBody = document.querySelector('.terminal-body');

if (terminalBody) {
  const script = [
    { type: 'line', text: 'whoami' },
    { type: 'result', text: 'Thato Goqo — Software Engineer & Web Developer' },
    { type: 'line', text: 'cat focus.txt' },
    { type: 'result', text: '3rd-year Bachelor of Computing student, Belgium Campus ITversity' },
    { type: 'line', text: 'ls skills/' },
    { type: 'result', text: 'C#  Java  JavaScript  Node.js  PostgreSQL  MongoDB' },
    { type: 'line', text: './run TK-Digital-Studio.sh' },
    { type: 'result', text: 'building sites for real clients since 2025 ✓' },
  ];

  terminalBody.innerHTML = '';
  let scriptIndex = 0;

  function typeLine(el, text, speed, onDone) {
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    el.appendChild(cursor);

    const interval = setInterval(() => {
      cursor.insertAdjacentText('beforebegin', text[i]);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        cursor.remove();
        if (onDone) onDone();
      }
    }, speed);
  }

  function runNext() {
    if (scriptIndex >= script.length) return;
    const step = script[scriptIndex];

    if (step.type === 'line') {
      const row = document.createElement('div');
      row.className = 'line';
      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.textContent = '$ ';
      row.appendChild(prompt);
      terminalBody.appendChild(row);

      typeLine(row, step.text, 35, () => {
        scriptIndex++;
        setTimeout(runNext, 200);
      });
    } else {
      const row = document.createElement('div');
      row.className = 'result';
      row.textContent = step.text;
      terminalBody.appendChild(row);
      scriptIndex++;
      setTimeout(runNext, 350);
    }
  }

  runNext();
}

// ----- three.js ambient background (home page only) -----
const heroCanvas = document.getElementById('hero-canvas');

if (heroCanvas && window.THREE) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    heroCanvas.clientWidth / heroCanvas.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas: heroCanvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resizeRenderer() {
    const width = heroCanvas.clientWidth;
    const height = heroCanvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resizeRenderer();

  // a scattered field of small points, standing in for "connected ideas"
  const pointCount = 220;
  const positions = new Float32Array(pointCount * 3);

  for (let i = 0; i < pointCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 70;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x4c8dff,
    size: 0.9,
    transparent: true,
    opacity: 0.7,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // a light wireframe icosahedron, slowly rotating — a nod to "structured logic"
  const shapeGeo = new THREE.IcosahedronGeometry(11, 1);
  const shapeMat = new THREE.MeshBasicMaterial({
    color: 0x4c8dff,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  const shape = new THREE.Mesh(shapeGeo, shapeMat);
  shape.position.set(14, -2, -10);
  scene.add(shape);

  let frameId;

  function animate() {
    points.rotation.y += 0.0006;
    shape.rotation.y += 0.0018;
    shape.rotation.x += 0.0008;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion) {
    animate();
  } else {
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    resizeRenderer();
    if (!reducedMotion) renderer.render(scene, camera);
  });
}

// ----- contact form UI (no backend — demo only) -----
const contactForm = document.getElementById('contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Message sent ✓';
    submitBtn.disabled = true;
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      contactForm.reset();
    }, 2200);
  });
}
