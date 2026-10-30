/* Thato Goqo — portfolio. Theme, menu, contact form. */
(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  function label() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  label();
  if (toggle) toggle.addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
    document.dispatchEvent(new Event('themechange'));
  });

  var menuBtn = document.getElementById('menu-btn'), links = document.getElementById('nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // The form opens the visitor's email app with the message filled in, so nothing is lost without a backend.
  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var subject = 'Portfolio message from ' + d.get('name');
    var body = d.get('message') + '\n\nFrom: ' + d.get('name') + ' (' + d.get('email') + ')';
    window.location.href = 'mailto:goqothato@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
