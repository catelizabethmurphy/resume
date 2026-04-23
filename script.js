// Render clips from clips.json
function renderClips(clips) {
    const container = document.getElementById('clips-container');
    if (!container) return;

    container.innerHTML = clips.map(clip => `
        <a class="clip-card" href="${clip.url}" target="_blank">
            <div class="clip-card-thumb">
                <img src="${clip.image}" alt="${clip.alt || ''}" loading="lazy">
            </div>
            <div class="clip-card-body">
                <div class="clip-meta">${clip.publication} <span class="clip-date">&bull; ${clip.date}</span></div>
                <h3 class="clip-headline">${clip.headline}</h3>
                ${clip.deck ? `<p class="clip-deck">${clip.deck}</p>` : ''}
            </div>
        </a>
    `).join('');
}

function loadClips() {
    fetch('clips.json')
        .then(res => res.json())
        .then(clips => renderClips(clips))
        .catch(err => console.error('Failed to load clips:', err));
}

// Page navigation
function showPage(id, el) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');

    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');

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

    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
        const navLink = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
        showPage(hash, navLink);
    }
});
