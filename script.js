/**
 * ============================================================
 * COMMUNE DE MARSASSOUM — Script JavaScript principal
 * script.js
 * Description :
 *   Comportements partagés par toutes les pages :
 *     1. Navbar (scroll, active link, mobile)
 *     2. Dark Mode (toggle + persistance localStorage)
 *     3. Bouton Retour en haut
 *     4. Animations au scroll (IntersectionObserver)
 *     5. Validation formulaire de contact
 *     6. Démarches — recherche et filtre
 *     7. Graphiques Chart.js (chargés si canvas présents)
 *     8. Carte Leaflet + GeoJSON (territoire.html)
 *     9. Compteur animé (chiffres héros)
 * ============================================================
 */

/* ══════════════════════════════════════════════════════════
   1. INITIALISATION AU CHARGEMENT DU DOM
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initDarkMode();
  initBackToTop();
  initScrollAnimations();
  initCounters();
  initContactForm();
  initDemarcheSearch();

  /* Carte Leaflet — chargée seulement si l'élément #map existe */
  if (document.getElementById('map')) {
    initMap();
  }

  /* Graphiques — chargés seulement si canvas Chart.js présents */
  if (typeof Chart !== 'undefined') {
    initCharts();
  }
});


/* ══════════════════════════════════════════════════════════
   2. NAVBAR
   - Ajoute classe .scrolled après 60px de défilement
   - Met en surbrillance le lien correspondant à la page active
══════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar  = document.getElementById('navbar');
  if (!navbar) return;

  /* Effet de scroll sur la navbar */
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); /* appel immédiat pour l'état initial */

  /* Active link — compare l'URL courante aux hrefs des liens */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#navbar .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}


/* ══════════════════════════════════════════════════════════
   3. DARK MODE
   - Bascule l'attribut data-theme sur <html>
   - Persiste le choix dans localStorage
   - Met à jour l'icône du bouton
══════════════════════════════════════════════════════════ */
function initDarkMode() {
  const toggleBtn = document.getElementById('darkModeToggle');
  if (!toggleBtn) return;

  const root    = document.documentElement;
  const icon    = toggleBtn.querySelector('i');
  const STORAGE = 'marsassoum-theme';

  /* Applique le thème sauvegardé */
  const saved = localStorage.getItem(STORAGE);
  if (saved === 'dark') {
    root.setAttribute('data-theme', 'dark');
    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) {
      root.removeAttribute('data-theme');
      localStorage.setItem(STORAGE, 'light');
      if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
    } else {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem(STORAGE, 'dark');
      if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    }
  });
}


/* ══════════════════════════════════════════════════════════
   4. BOUTON RETOUR EN HAUT
   - Apparaît après 400px de défilement
   - Scroll fluide vers le haut au clic
══════════════════════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ══════════════════════════════════════════════════════════
   5. ANIMATIONS AU SCROLL (IntersectionObserver)
   - Ajoute la classe .visible aux éléments .fade-up / .fade-left / .fade-right
     dès qu'ils entrent dans le viewport
══════════════════════════════════════════════════════════ */
function initScrollAnimations() {
  const animClasses = ['.fade-up', '.fade-left', '.fade-right'];
  const elements = document.querySelectorAll(animClasses.join(', '));
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); /* anime une seule fois */
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}


/* ══════════════════════════════════════════════════════════
   6. COMPTEURS ANIMÉS
   - Cherche les éléments [data-count] et anime leur valeur
     de 0 à la valeur cible en 1.5s
══════════════════════════════════════════════════════════ */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el      = entry.target;
      const target  = parseInt(el.getAttribute('data-count'), 10);
      const suffix  = el.getAttribute('data-suffix') || '';
      const duration = 1500;
      const step     = 16;
      const increment = target / (duration / step);
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.floor(current).toLocaleString('fr-FR') + suffix;
      }, step);

      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}


/* ══════════════════════════════════════════════════════════
   7. VALIDATION FORMULAIRE DE CONTACT
   - Valide les champs requis avant soumission
   - Affiche les erreurs inline
   - Simule l'envoi (pas de back-end ici)
══════════════════════════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  /* Efface l'erreur au focus */
  form.querySelectorAll('.form-control-custom').forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.remove('is-error');
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    /* Validation de chaque champ requis */
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('is-error');
        valid = false;
      }
    });

    /* Validation email */
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value.trim())) {
        emailField.classList.add('is-error');
        valid = false;
      }
    }

    if (valid) {
      /* Simulation d'envoi */
      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Envoi en cours…';

      setTimeout(() => {
        const successEl = document.getElementById('formSuccess');
        if (successEl) {
          form.style.display = 'none';
          successEl.style.display = 'block';
        }
      }, 1800);
    }
  });
}


/* ══════════════════════════════════════════════════════════
   8. RECHERCHE DANS LES DÉMARCHES
   - Filtre les .demarche-row selon le texte de recherche
══════════════════════════════════════════════════════════ */
function initDemarcheSearch() {
  const searchInput = document.getElementById('searchDemarche');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('.demarche-row').forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });
}


/* ══════════════════════════════════════════════════════════
   9. GRAPHIQUES CHART.JS
   - Initialisés seulement si les canvas correspondants existent
══════════════════════════════════════════════════════════ */
function initCharts() {

  /* ── Palette commune ── */
  const C_PRIMARY   = '#1a4f72';
  const C_SECONDARY = '#2e8b57';
  const C_ACCENT    = '#c8960c';
  const C_PURPLE    = '#7c3aed';
  const C_RED       = '#dc2626';
  const C_GRAY      = '#94a3b8';

  /* Options globales par défaut */
  Chart.defaults.font.family = "'DM Sans', sans-serif";
  Chart.defaults.color       = '#6b7a8d';

  /* ── Graphique 1 : Évolution de la population ── */
  const elPop = document.getElementById('chartPopulation');
  if (elPop) {
    new Chart(elPop, {
      type: 'line',
      data: {
        labels: ['2010','2012','2014','2016','2018','2020','2022','2024'],
        datasets: [{
          label: 'Population',
          data: [8200, 8900, 9600, 10400, 11200, 12100, 13000, 13800],
          borderColor: C_PRIMARY,
          backgroundColor: 'rgba(26,79,114,.1)',
          borderWidth: 2.5,
          fill: true,
          tension: .4,
          pointRadius: 5,
          pointBackgroundColor: C_ACCENT,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,.05)' },
            ticks: { callback: v => v.toLocaleString('fr-FR') }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  /* ── Graphique 2 : Répartition budgétaire (donut) ── */
  const elBudget = document.getElementById('chartBudget');
  if (elBudget) {
    new Chart(elBudget, {
      type: 'doughnut',
      data: {
        labels: ['Éducation','Infrastructure','Santé','Administration','Social','Autres'],
        datasets: [{
          data: [30, 32, 18, 10, 7, 3],
          backgroundColor: [C_PRIMARY, C_SECONDARY, C_ACCENT, C_PURPLE, C_RED, C_GRAY],
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12, font: { size: 11 } }
          }
        }
      }
    });
  }

  /* ── Graphique 3 : Accès aux services de base ── */
  const elServices = document.getElementById('chartServices');
  if (elServices) {
    new Chart(elServices, {
      type: 'bar',
      data: {
        labels: ['Eau potable','Électricité','Assainissement','Internet','Santé < 5km','École < 1km'],
        datasets: [{
          label: 'Accès (%)',
          data: [72, 55, 38, 25, 88, 82],
          backgroundColor: [C_PRIMARY, C_SECONDARY, C_ACCENT, C_PURPLE, C_SECONDARY, C_PRIMARY],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: {
            max: 100,
            grid: { color: 'rgba(0,0,0,.05)' },
            ticks: { callback: v => v + '%' }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }

  /* ── Graphique 4 : Emploi & activités économiques ── */
  const elEmploi = document.getElementById('chartEmploi');
  if (elEmploi) {
    new Chart(elEmploi, {
      type: 'bar',
      data: {
        labels: ['Agriculture','Commerce','Artisanat','Élevage','Pêche','Fonctionnaires'],
        datasets: [{
          label: 'Part de la population active (%)',
          data: [48, 18, 12, 10, 5, 7],
          backgroundColor: [C_SECONDARY, C_PRIMARY, C_ACCENT, C_SECONDARY + 'bb', C_PRIMARY + 'bb', C_GRAY],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 60,
            grid: { color: 'rgba(0,0,0,.05)' },
            ticks: { callback: v => v + '%' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }
}


/* ══════════════════════════════════════════════════════════
   10. CARTE INTERACTIVE LEAFLET (territoire.html)
       GeoJSON : écoles, santé, eau, marchés, admin
══════════════════════════════════════════════════════════ */
function initMap() {

  /* ── Données GeoJSON — infrastructures de Marsassoum ── */
  const geojsonData = {
    type: 'FeatureCollection',
    features: [
      /* Écoles */
      { type:'Feature', properties:{ type:'ecoles', nom:'École Élémentaire Marsassoum Centre', desc:'8 classes — 480 élèves', icon:'🏫' }, geometry:{ type:'Point', coordinates:[-15.978, 12.832] } },
      { type:'Feature', properties:{ type:'ecoles', nom:'École Élémentaire Quartier Peul', desc:'6 classes — 320 élèves', icon:'🏫' }, geometry:{ type:'Point', coordinates:[-15.985, 12.838] } },
      { type:'Feature', properties:{ type:'ecoles', nom:'CEM de Marsassoum', desc:'Collège — 650 élèves', icon:'🏫' }, geometry:{ type:'Point', coordinates:[-15.974, 12.828] } },
      { type:'Feature', properties:{ type:'ecoles', nom:'Lycée Départemental', desc:'900 lycéens', icon:'🏫' }, geometry:{ type:'Point', coordinates:[-15.971, 12.835] } },

      /* Santé */
      { type:'Feature', properties:{ type:'sante', nom:'Poste de Santé Principal', desc:'Urgences, maternité, consultations', icon:'🏥' }, geometry:{ type:'Point', coordinates:[-15.980, 12.830] } },
      { type:'Feature', properties:{ type:'sante', nom:'Case de Santé Nord', desc:'Soins primaires — quartier nord', icon:'🏥' }, geometry:{ type:'Point', coordinates:[-15.976, 12.841] } },
      { type:'Feature', properties:{ type:'sante', nom:'Pharmacie Communale', desc:'Médicaments essentiels', icon:'💊' }, geometry:{ type:'Point', coordinates:[-15.982, 12.833] } },

      /* Eau / Forages */
      { type:'Feature', properties:{ type:'eau', nom:'Forage Solaire Principal', desc:'Débit : 8 m³/h — 2 400 ménages', icon:'💧' }, geometry:{ type:'Point', coordinates:[-15.990, 12.835] } },
      { type:'Feature', properties:{ type:'eau', nom:'Château d\'eau Central', desc:'Capacité : 250 m³', icon:'💧' }, geometry:{ type:'Point', coordinates:[-15.983, 12.826] } },
      { type:'Feature', properties:{ type:'eau', nom:'Point d\'eau Quartier Sud', desc:'Borne fontaine — usage communautaire', icon:'💧' }, geometry:{ type:'Point', coordinates:[-15.977, 12.822] } },

      /* Marchés */
      { type:'Feature', properties:{ type:'marches', nom:'Marché Hebdomadaire Central', desc:'350 étals — Jeudi & Dimanche', icon:'🛒' }, geometry:{ type:'Point', coordinates:[-15.981, 12.831] } },
      { type:'Feature', properties:{ type:'marches', nom:'Marché aux Bestiaux', desc:'Bovins, ovins, caprins — Samedi', icon:'🐄' }, geometry:{ type:'Point', coordinates:[-15.995, 12.828] } },

      /* Administration */
      { type:'Feature', properties:{ type:'admin', nom:'Hôtel de Ville — Mairie', desc:'Siège de la commune — M. Seny Mandiang, Maire', icon:'🏛️' }, geometry:{ type:'Point', coordinates:[-15.979, 12.832] } },
      { type:'Feature', properties:{ type:'admin', nom:'Sous-Préfecture de Marsassoum', desc:'Représentation de l\'État', icon:'🏛️' }, geometry:{ type:'Point', coordinates:[-15.982, 12.830] } },
      { type:'Feature', properties:{ type:'admin', nom:'Gendarmerie Nationale', desc:'Sécurité publique', icon:'🚔' }, geometry:{ type:'Point', coordinates:[-15.975, 12.836] } }
    ]
  };

  /* Limite approximative de la commune (polygone) */
  const communeBoundary = {
    type: 'Feature',
    properties: { name: 'Commune de Marsassoum' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-16.00, 12.85], [-15.96, 12.85],
        [-15.96, 12.81], [-16.00, 12.81],
        [-16.00, 12.85]
      ]]
    }
  };

  /* Couleurs par catégorie */
  const colors = {
    ecoles:  '#dc2626',
    sante:   '#2e8b57',
    eau:     '#0891b2',
    marches: '#c8960c',
    admin:   '#7c3aed'
  };

  /* ── Couches de fond ── */
  const baseLayers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri — World Imagery',
      maxZoom: 19
    }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap',
      maxZoom: 17
    })
  };

  /* ── Initialisation de la carte ── */
  const map = L.map('map', {
    center: [12.832, -15.980],
    zoom: 14,
    layers: [baseLayers.osm]
  });

  /* Périmètre communal */
  L.geoJSON(communeBoundary, {
    style: {
      color: '#1a4f72',
      weight: 2.5,
      opacity: .85,
      fillColor: '#1a4f72',
      fillOpacity: .06,
      dashArray: '7 4'
    }
  }).addTo(map)
    .bindTooltip('Commune de Marsassoum', {
      permanent: true,
      direction: 'center',
      className: 'commune-label'
    });

  /* ── Construction des couches par type ── */
  const layers = {};

  ['ecoles', 'sante', 'eau', 'marches', 'admin'].forEach(type => {
    const color    = colors[type];
    const features = geojsonData.features.filter(f => f.properties.type === type);

    layers[type] = L.featureGroup(
      features.map(f => {
        const [lng, lat] = f.geometry.coordinates;
        const p          = f.properties;

        return L.circleMarker([lat, lng], {
          radius:      9,
          fillColor:   color,
          color:       '#ffffff',
          weight:      2.5,
          fillOpacity: .88,
          opacity:     1
        }).bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:210px;padding:.4rem 0;">
            <div style="font-size:1.6rem;text-align:center;margin-bottom:.5rem;">${p.icon}</div>
            <strong style="font-size:.92rem;color:#1a4f72;display:block;margin-bottom:.25rem;">${p.nom}</strong>
            <span style="font-size:.78rem;color:#6b7a8d;">${p.desc}</span>
            <span style="display:inline-block;margin-top:.5rem;background:${color};color:#fff;font-size:.7rem;font-weight:600;padding:.2rem .55rem;border-radius:4px;">
              ${type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </div>
        `, { maxWidth: 260 });
      })
    ).addTo(map);
  });

  /* ── Ajustement de la vue ── */
  try {
    map.fitBounds(L.geoJSON(communeBoundary).getBounds(), { padding: [30, 30] });
  } catch(e) { /* fallback : centre par défaut */ }

  /* ── Contrôle des couches (toggle) ── */
  window.toggleMapLayer = function(type) {
    const chk = document.getElementById('chk-' + type);
    if (!chk) return;
    if (chk.checked) {
      layers[type].addTo(map);
    } else {
      map.removeLayer(layers[type]);
    }
  };

  /* ── Changement de fond de carte ── */
  window.changeBasemap = function(value) {
    Object.values(baseLayers).forEach(bl => map.removeLayer(bl));
    baseLayers[value].addTo(map);
    /* Remet les couches de données par-dessus */
    ['ecoles','sante','eau','marches','admin'].forEach(t => {
      const chk = document.getElementById('chk-' + t);
      if (chk && chk.checked) layers[t].addTo(map);
    });
  };
}
