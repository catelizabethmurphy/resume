// ===================== REPORTING =====================
let clips = [];

// Embeddable stories open in place; the rest open in a new tab, because
// AP sends frame-ancestors 'self' and will not render in an iframe.
function renderClips() {
    const container = document.getElementById('clips-container');
    if (!container) return;

    container.innerHTML = clips.map((clip, i) => {
        const inner = `
            <div class="clip-card-thumb">
                <img src="${clip.image}" alt="${clip.alt || ''}" loading="lazy">
            </div>
            <div class="clip-card-body">
                <div class="clip-meta">${clip.publication} <span class="clip-date">&bull; ${clip.date}</span></div>
                <h3 class="clip-headline">${clip.headline}</h3>
                ${clip.deck ? `<p class="clip-deck">${clip.deck}</p>` : ''}
            </div>`;

        return clip.embeddable
            ? `<button class="clip-card" type="button" onclick="openClip(${i})">${inner}</button>`
            : `<a class="clip-card" href="${clip.url}" target="_blank" rel="noopener">${inner}</a>`;
    }).join('');
}

function openClip(i) {
    const c = clips[i];
    const detail = document.getElementById('clips-detail');
    const container = document.getElementById('clips-container');
    if (!c || !detail || !container) return;

    detail.innerHTML = `
        <button class="graphic-back" type="button" onclick="closeClip()">
            <i class="bi bi-arrow-left"></i> All reporting
        </button>
        <div class="graphic-meta">${c.publication} <span class="graphic-date">&bull; ${c.date}</span></div>
        <h2 class="graphic-detail-title">
            <a href="${c.url}" target="_blank" rel="noopener">${c.headline}<i class="bi bi-arrow-up-right"></i></a>
        </h2>
        ${c.deck ? `<p class="graphic-detail-desc">${c.deck}</p>` : ''}
        <div class="graphic-embed-wrap" style="height:min(1100px, 84vh)">
            <iframe src="${c.url}" title="${c.headline}" loading="lazy"
                    frameborder="0" scrolling="yes" allowfullscreen></iframe>
        </div>
    `;

    container.hidden = true;
    detail.hidden = false;
    window.scrollTo({ top: 0 });
}

function closeClip() {
    const detail = document.getElementById('clips-detail');
    const container = document.getElementById('clips-container');
    if (!detail || !container) return;
    detail.hidden = true;
    detail.innerHTML = '';
    container.hidden = false;
}

function loadClips() {
    fetch('clips.json')
        .then(res => res.json())
        .then(data => { clips = data; renderClips(); })
        .catch(err => console.error('Failed to load clips:', err));
}

// ===================== GRAPHICS =====================
let graphics = [];

function graphicCard(g, i) {
    return `
        <button class="graphic-card" type="button" onclick="openGraphic(${i})"
                aria-label="${g.title}">
            ${g.thumb || g.image
                ? `<img src="${g.thumb || g.image}" alt="${g.alt || ''}" loading="lazy">`
                : `<div class="graphic-card-placeholder"><span>${g.title}</span></div>`}
            <span class="graphic-overlay">
                ${g.type === 'embed'
                    ? '<span class="graphic-badge">Interactive</span>'
                    : '<span class="graphic-badge graphic-badge-static">Static</span>'}
                <span class="graphic-overlay-title">${g.title}</span>
            </span>
        </button>
    `;
}

// Read each thumbnail's shape so columns can be packed by real height
function measureShapes() {
    return Promise.all(graphics.map(g => new Promise(resolve => {
        const src = g.thumb || g.image;
        if (!src) return resolve(1.4);            // placeholder card
        const img = new Image();
        img.onload = () => resolve(img.naturalHeight / img.naturalWidth);
        img.onerror = () => resolve(1);
        img.src = src;
    })));
}

// Two hand-packed columns: nothing is cropped, nothing leaves a gap, and the
// first two entries sit at the top of each column so JSON order still places
// them. Everything after goes to whichever column is currently shorter.
function renderGraphics(shapes) {
    const container = document.getElementById('graphics-container');
    if (!container) return;

    if (window.innerWidth <= 900) {
        container.innerHTML = `<div class="graphics-col">${graphics.map(graphicCard).join('')}</div>`;
        return;
    }

    const cols = [[], []];
    const heights = [0, 0];

    graphics.forEach((g, i) => {
        const c = i < 2 ? i : (heights[0] <= heights[1] ? 0 : 1);
        cols[c].push(graphicCard(g, i));
        heights[c] += shapes[i];
    });

    container.innerHTML = cols
        .map(col => `<div class="graphics-col">${col.join('')}</div>`)
        .join('');
}

function openGraphic(i) {
    const g = graphics[i];
    const detail = document.getElementById('graphics-detail');
    const container = document.getElementById('graphics-container');
    if (!g || !detail || !container) return;

    const media = g.type === 'embed'
        ? `<div class="graphic-embed-wrap" style="height:min(${g.embedHeight || 720}px, 84vh)">
               <iframe src="${g.embed}" title="${g.title}" loading="lazy"
                       frameborder="0" scrolling="yes" allowfullscreen></iframe>
           </div>`
        : `<img class="graphic-detail-img" src="${g.image}" alt="${g.alt || ''}">`;

    detail.innerHTML = `
        <button class="graphic-back" type="button" onclick="closeGraphic()">
            <i class="bi bi-arrow-left"></i> All graphics
        </button>
        <div class="graphic-meta">${g.publication} <span class="graphic-date">&bull; ${g.date}</span></div>
        <h2 class="graphic-detail-title">${g.url
            ? `<a href="${g.url}" target="_blank" rel="noopener">${g.title}<i class="bi bi-arrow-up-right"></i></a>`
            : g.title}</h2>
        ${g.description ? `<p class="graphic-detail-desc">${g.description}</p>` : ''}
        ${g.tools ? `<p class="graphic-toolline"><span>Built with</span> ${g.tools.join(' &middot; ')}</p>` : ''}
        ${media}
    `;

    container.hidden = true;
    detail.hidden = false;
    window.scrollTo({ top: 0 });
}

function closeGraphic() {
    const detail = document.getElementById('graphics-detail');
    const container = document.getElementById('graphics-container');
    if (!detail || !container) return;
    detail.hidden = true;
    detail.innerHTML = '';
    container.hidden = false;
}

let graphicShapes = [];

function loadGraphics() {
    fetch('graphics.json')
        .then(res => res.json())
        .then(data => {
            graphics = data;
            return measureShapes();
        })
        .then(shapes => { graphicShapes = shapes; renderGraphics(shapes); })
        .catch(err => console.error('Failed to load graphics:', err));
}

// ===================== PHOTOS =====================
// Two galleries: 'photos' is the photojournalism tab, 'cat' is the strip on
// the About page. They share one lightbox.
const galleries = { photos: [], cat: [] };
let lightboxSet = 'photos';
let lightboxIndex = 0;

function renderGallery(key, containerId, itemClass, opts = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const items = galleries[key];

    if (!items.length) {
        container.innerHTML = opts.plain ? '' : `<p class="gallery-empty">Coming soon.</p>`;
        return;
    }

    // Plain galleries reveal their caption on hover — no lightbox
    if (opts.plain) {
        container.innerHTML = items.map(p => `
            <div class="${itemClass}">
                <img src="${p.thumb || p.image}" alt="${p.alt || ''}" loading="lazy">
                ${p.caption ? `<span class="photo-caption">${p.caption}</span>` : ''}
            </div>
        `).join('');
        return;
    }

    container.innerHTML = items.map((p, i) => `
        <button class="${itemClass}" type="button" onclick="openLightbox('${key}', ${i})"
                aria-label="${p.caption || 'Photo'}">
            <img src="${p.thumb || p.image}" alt="${p.alt || ''}" loading="lazy">
            ${p.caption ? `<span class="photo-caption">${p.caption}</span>` : ''}
        </button>
    `).join('');
}

function openLightbox(key, i) {
    const p = galleries[key] && galleries[key][i];
    const box = document.getElementById('lightbox');
    if (!p || !box) return;

    lightboxSet = key;
    lightboxIndex = i;
    document.getElementById('lightbox-img').src = p.image;
    document.getElementById('lightbox-img').alt = p.alt || '';
    document.getElementById('lightbox-cap').textContent = p.caption || '';
    box.hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const box = document.getElementById('lightbox');
    if (!box) return;
    box.hidden = true;
    document.getElementById('lightbox-img').src = '';
    document.body.style.overflow = '';
}

function stepLightbox(dir) {
    const items = galleries[lightboxSet];
    if (!items || !items.length) return;
    openLightbox(lightboxSet, (lightboxIndex + dir + items.length) % items.length);
}

function loadPhotos() {
    fetch('photos.json')
        .then(res => res.json())
        .then(data => { galleries.photos = data; renderGallery('photos', 'photos-container', 'photo-item'); })
        .catch(err => console.error('Failed to load photos:', err));

    fetch('cat.json')
        .then(res => res.json())
        .then(data => {
            galleries.cat = data;
            renderGallery('cat', 'cat-container', 'cat-item', { plain: true });
        })
        .catch(err => console.error('Failed to load cat photos:', err));
}

// ===================== WORK NAV GROUP =====================
const WORK_PAGES = ['reporting', 'graphics', 'photos'];

function setWorkOpen(open) {
    const group = document.getElementById('nav-work');
    if (!group) return;
    group.classList.toggle('open', open);
    const btn = group.querySelector('.nav-group-label');
    if (btn) btn.setAttribute('aria-expanded', String(open));
}

// Clicking "Work" while collapsed jumps to Reporting; otherwise just folds it up
function toggleWork() {
    const group = document.getElementById('nav-work');
    if (!group) return;

    if (group.classList.contains('open')) {
        setWorkOpen(false);
    } else {
        const first = group.querySelector('.nav-sub a');
        showPage('reporting', first);
    }
}

// Page navigation
function showPage(id, el) {
    // Leaving a page tears down any live embed on it
    if (id !== 'graphics') closeGraphic();
    if (id !== 'reporting') closeClip();
    closeLightbox();

    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');

    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');

    const inWork = WORK_PAGES.includes(id);
    setWorkOpen(inWork);

    // Keep "Work" marked as current even if you fold it up
    const group = document.getElementById('nav-work');
    if (group) group.classList.toggle('current', inWork);

    document.querySelector('.sidebar').classList.remove('open');
    document.querySelector('.mobile-overlay').classList.remove('visible');

    window.scrollTo({ top: 0 });
}

// Mobile sidebar toggle
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
    document.querySelector('.mobile-overlay').classList.toggle('visible');
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    loadClips();
    loadGraphics();
    loadPhotos();

    let hash = window.location.hash.replace('#', '');
    if (hash === 'clips') hash = 'reporting'; // old links still land somewhere sensible

    if (hash && document.getElementById(hash)) {
        const navLink = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
        showPage(hash, navLink);
    }

    // Lightbox: click the backdrop or press Escape / arrows
    const box = document.getElementById('lightbox');
    if (box) {
        box.addEventListener('click', e => {
            if (e.target === box) closeLightbox();
        });
    }

    // Repack the graphics columns when the layout switches between one and two
    let graphicsResizeTimer;
    let wasNarrow = window.innerWidth <= 900;
    window.addEventListener('resize', () => {
        clearTimeout(graphicsResizeTimer);
        graphicsResizeTimer = setTimeout(() => {
            const isNarrow = window.innerWidth <= 900;
            if (isNarrow !== wasNarrow && graphicShapes.length) {
                wasNarrow = isNarrow;
                renderGraphics(graphicShapes);
            }
        }, 150);
    });

    document.addEventListener('keydown', e => {
        if (!box || box.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') stepLightbox(-1);
        if (e.key === 'ArrowRight') stepLightbox(1);
    });
});
