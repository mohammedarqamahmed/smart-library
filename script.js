// storage keys
const STORAGE_KEY = 'smartLibraryBooks_v4';
const THEME_KEY = 'smartLibraryTheme_v1';

// DOM
const bookForm = document.getElementById('book-form');
const booksContainer = document.getElementById('books');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const categoryChips = document.getElementById('category-chips');
const visibleCount = document.getElementById('visible-count');
const totalCount = document.getElementById('total-count');
const themeToggle = document.getElementById('theme-toggle');

// Demo books (will load only if localStorage empty)
const demoBooks = [
  { id: 'b1', title: 'Clean Code', author: 'Robert C. Martin', category: 'Programming', description: 'A handbook of agile software craftsmanship.', image: 'https://picsum.photos/seed/clean/400/300' },
  { id: 'b2', title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', category: 'Programming', description: 'A modern introduction to programming.', image: 'https://picsum.photos/seed/eloquent/400/300' },
  { id: 'b3', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', description: 'A tale about following your dreams.', image: 'https://picsum.photos/seed/alchemist/400/300' },
  { id: 'b4', title: 'Brief History of Time', author: 'Stephen Hawking', category: 'Science', description: 'From the Big Bang to black holes.', image: 'https://picsum.photos/seed/brief/400/300' },
  { id: 'b5', title: 'You Don’t Know JS', author: 'Kyle Simpson', category: 'Programming', description: 'Deep dive into JavaScript core mechanisms.', image: 'https://picsum.photos/seed/ydk/400/300' },
  { id: 'b6', title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', description: 'A brief history of humankind.', image: 'https://picsum.photos/seed/sapiens/400/300' },
  { id: 'b7', title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', description: 'Tiny changes, remarkable results.', image: 'https://picsum.photos/seed/atomic/400/300' },
  { id: 'b8', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Programming', description: 'Journey to mastery.', image: 'https://picsum.photos/seed/pragmatic/400/300' }
];

// initialize books from localStorage or demo
let books = JSON.parse(localStorage.getItem(STORAGE_KEY));
if (!Array.isArray(books) || books.length === 0) {
  books = demoBooks.slice(); // copy demo
  saveBooks();
}

// THEME: init from localStorage or system preference
function getPreferredTheme(){
  const stored = localStorage.getItem(THEME_KEY);
  if(stored) return stored;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}
function applyTheme(theme){
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}
themeToggle.addEventListener('click', ()=>{
  const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});
applyTheme(getPreferredTheme());

// BOOKS UI helpers
function saveBooks(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(books)); }
function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'": '&#39;'}[s])); }

function createCardHTML(b){
  const status = b.issued ? `<span class="pill issued">Issued</span>` : `<span class="pill available">Available</span>`;
  const borrowerLine = b.issued ? `\n<div class="meta">Borrower: <strong>${escapeHtml(b.borrower || '')}</strong></div>` : '';
  const img = b.image ? `<img class="thumb" src="${escapeHtml(b.image)}" alt="${escapeHtml(b.title)}">` : `<div class="thumb" style="display:flex;align-items:center;justify-content:center;color:var(--muted);">No image</div>`;
  return `
  <article class="card" data-id="${b.id}">
    ${img}
    <div>
      <strong>${escapeHtml(b.title)}</strong>
      <div class="meta">${escapeHtml(b.author)} • ${escapeHtml(b.category || 'General')}</div>
      ${b.description ? `<div class="meta" style="margin-top:6px">${escapeHtml(b.description)}</div>` : ''}
    </div>
    <div class="meta">${status}${borrowerLine}</div>
    <div class="actions">
      <button class="btn ${b.issued ? 'return' : 'issue'}">${b.issued ? 'Return' : 'Issue'}</button>
      <button class="btn delete">Delete</button>
    </div>
  </article>
`;
}

// build category list from books
function getCategories(){
  const set = new Set();
  books.forEach(b => { if(b.category && b.category.trim()) set.add(b.category.trim()); });
  return Array.from(set).sort();
}

function populateCategoryFilter(){
  const cats = getCategories();
  categoryFilter.innerHTML = `<option value="">All categories</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  // chips
  categoryChips.innerHTML = `<div class="chip" data-cat="">All</div>` + cats.map(c => `<div class="chip" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</div>`).join('');
  // attach chip listeners
  categoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', ()=> {
      const cat = chip.getAttribute('data-cat');
      // set select and trigger input
      categoryFilter.value = cat;
      categoryChips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
      chip.classList.add('active');
      renderBooks(searchInput.value, categoryFilter.value);
    });
  });
}

// render books with optional search + category filter
function renderBooks(filter = '', category = ''){
  const q = (filter || '').trim().toLowerCase();
  const cat = (category || '').trim().toLowerCase();
  const list = books.filter(b => {
    let match = true;
    if(q) match = (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q);
    if(cat) match = match && ((b.category || '').toLowerCase() === cat);
    return match;
  });

  totalCount.textContent = books.length;
  visibleCount.textContent = list.length;

  if(list.length === 0){
    booksContainer.innerHTML = '<p style="grid-column:1/-1;opacity:0.7">No books found — add your first book.</p>';
    return;
  }

  booksContainer.innerHTML = list.map(createCardHTML).join('');
  // staggered animation
  document.querySelectorAll('.card').forEach((c,i)=>{
    c.style.opacity = 0;
    c.style.transform = 'translateY(8px)';
    setTimeout(()=>{ c.style.transition = 'all 260ms ease'; c.style.opacity = 1; c.style.transform = 'translateY(0)'; }, 60 * i);
  });
}

// form submit - add book
bookForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const category = document.getElementById('category').value.trim();
  const image = document.getElementById('image').value.trim();
  const description = document.getElementById('description').value.trim();
  if(!title || !author) return alert('Please enter title and author');
  const book = { id: Date.now().toString(), title, author, category, description, image, issued:false, borrower:null };
  books.unshift(book);
  saveBooks();
  populateCategoryFilter();
  renderBooks(searchInput.value, categoryFilter.value);
  bookForm.reset();
});

// book actions (issue / return / delete)
booksContainer.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if(!card) return;
  const id = card.dataset.id;
  const idx = books.findIndex(b => b.id === id);
  if(idx === -1) return;

  if(e.target.classList.contains('delete')){
    if(confirm('Delete this book?')){
      books.splice(idx,1);
      saveBooks();
      populateCategoryFilter();
      renderBooks(searchInput.value, categoryFilter.value);
    }
  } else if(e.target.classList.contains('issue')){
    const borrower = prompt('Enter borrower name:');
    if(borrower){
      books[idx].issued = true;
      books[idx].borrower = borrower;
      books[idx].issuedDate = new Date().toISOString();
      saveBooks();
      renderBooks(searchInput.value, categoryFilter.value);
    }
  } else if(e.target.classList.contains('return')){
    if(confirm('Mark as returned?')){
      books[idx].issued = false;
      books[idx].borrower = null;
      books[idx].issuedDate = null;
      saveBooks();
      renderBooks(searchInput.value, categoryFilter.value);
    }
  }
});

// search + filter handlers
searchInput.addEventListener('input', e => renderBooks(e.target.value, categoryFilter.value));
categoryFilter.addEventListener('change', e => {
  // set active chip
  const val = e.target.value;
  categoryChips.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x.getAttribute('data-cat') === val));
  renderBooks(searchInput.value, val);
});

// initial population
populateCategoryFilter();
renderBooks();

// optional: clear old demo key if you want to reset demo (for dev)
// localStorage.removeItem(STORAGE_KEY);

