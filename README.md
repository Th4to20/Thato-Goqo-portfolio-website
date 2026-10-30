# Thato Goqo — Portfolio

Personal portfolio for Thato Goqo, a 3rd-year Bachelor of Computing student and co-founder of **TK Digital Studio**. Built by hand with vanilla HTML, CSS and JavaScript, no frameworks and no build step.

**Live site:** https://thatogoqo.netlify.app

## Pages

- `index.html` — intro, a live agent-based sandbox, selected work
- `about.html` — background, facts and timeline
- `skills.html` — skills, each tied to the project where it was used
- `projects.html` — ABM.NET, CivicConnect, TK Digital Studio, EventHub, Cleaning Inventory System
- `contact.html` — contact links and a form that opens the visitor's email app

## Features

- Live sandbox on the home page: an agent-based model with 20 seeded runs, average and range chart, spread-rate control and CSV export (`js/sim-core.js`, `js/sandbox.js`)
- Light and dark themes (follows the system, remembers the choice)
- Responsive, keyboard accessible, respects reduced motion
- JSON-LD structured data and Open Graph tags
- Downloadable CV at `assets/Thato_Goqo_CV.pdf`

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Fonts (Bricolage Grotesque, Newsreader) load from Google Fonts and fall back to system fonts offline.

## Structure

```
.
├── index.html  about.html  skills.html  projects.html  contact.html
├── css/style.css
├── js/main.js  js/sim-core.js  js/sandbox.js
└── assets/profile.jpg  assets/Thato_Goqo_CV.pdf
```

© Thato Goqo. All rights reserved.
