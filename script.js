// storage keys
const STORAGE_KEY = 'smartLibraryBooks_v3';
const THEME_KEY = 'smartLibraryTheme';

let books = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const bookForm = document.getElementById('book-form');
const booksContainer = document.getElementById('books');
const searchInput = document.getElementById('search');
const themeToggle = document.getElementById('theme-toggle');

// THEME: init from localStorage or system preference
function getPreferredTheme(){
  const stored = localStorage.getItem(THEME_KEY);
  if(stored) return stored;
  // check system pref
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function applyTheme(theme){
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

// toggle
themeToggle.addEventListener('click', ()=>{
  const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

// initial theme apply on load
applyTheme(getPreferredTheme());

// BOOKS UI
function saveBooks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function createCardHTML(b){
  const status = b.issued ? `<span class="pill issued">Issued</span>` : `<span class="pill available">Available</span>`;
  const borrowerLine = b.issued ? `
<div class="meta">Borrower: <strong>${escapeHtml(b.borrower || '')}</strong></div>` : '';
  return `
  <article class="card" data-id="${b.id}\">
    <div>
      <strong>${escapeHtml(b.title)}</strong>
      <div class="meta">${escapeHtml(b.author)} • ${escapeHtml(b.category || 'General')}</div>
    </div>
    <div class="meta">${status}${borrowerLine}</div>
    <div class="actions">
      <button class="btn ${b.issued ? 'return' : 'issue'}">${b.issued ? 'Return' : 'Issue'}</button>
      <button class="btn delete">Delete</button>
    </div>
  </article>
`;
}

function renderBooks(filter = ''){
  const q = filter.trim().toLowerCase();
  const list = books.filter(b => {
    if(!q) return true;
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  });

  if(list.length === 0){
    booksContainer.innerHTML = '<p style="grid-column:1/-1;opacity:0.7">No books found — add your first book.</p>';
    return;
  }

  booksContainer.innerHTML = list.map(createCardHTML).join('')
