/* Smart Library — full frontend (localStorage per user) */
const THEME_KEY = 'smartTheme_v2';
const STORAGE_PREFIX = 'smartBooks_'; // per-user store key: smartBooks_<username>
const DEFAULT_USER = localStorage.getItem('smart_current_user') || 'guest';

// DOM
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const categoryChips = document.getElementById('category-chips');
const booksContainer = document.getElementById('books');
const bookForm = document.getElementById('book-form');
const visibleCount = document.getElementById('visible-count');
const totalCount = document.getElementById('total-count');
const themeToggle = document.getElementById('theme-toggle');
const suggestionsBox = document.getElementById('suggestions');
const showFavoritesOnly = document.getElementById('show-favorites-only');
const showIssuedOnly = document.getElementById('show-issued-only');
const pdfModal = document.getElementById('pdf-modal');
const pdfClose = document.getElementById('pdf-close');
const pdfFrame = document.getElementById('pdf-frame');
const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const loginClose = document.getElementById('login-close');
const loginForm = document.getElementById('login-form');
const currentUserSpan = document.getElementById('current-user');
const cardTemplate = document.getElementById('card-template');

// demo books (used when user has no books)
const demoBooks = [
  { id: 'b1', title: 'Clean Code', author: 'Robert C. Martin', category: 'Programming', description: 'A handbook of agile software craftsmanship.', image:'https://picsum.photos/seed/clean/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id: 'b2', title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', category: 'Programming', description: 'A modern introduction to programming.', image:'https://picsum.photos/seed/elo/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id: 'b3', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', description: 'A tale about following your dreams.', image:'https://picsum.photos/seed/alc/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id: 'b4', title: 'Brief History of Time', author: 'Stephen Hawking', category: 'Science', description: 'From the Big Bang to black holes.', image:'https://picsum.photos/seed/brief/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id: 'b5', title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', description: 'A brief history of humankind.', image:'https://picsum.photos/seed/sap/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 }
];

// current state
let currentUser = DEFAULT_USER;
let books = loadBooksForUser(currentUser);

// THEME
function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) return stored;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}
themeToggle.addEventListener('click', ()=> applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
applyTheme(getPreferredTheme());

// USER & storage
function storeKeyFor(user){ return STORAGE_PREFIX + user; }
function loadBooksForUser(user){
  const raw = localStorage.getItem(storeKeyFor(user));
  if(!raw){ localStorage.setItem(storeKeyFor(user), JSON.stringify(demoBooks)); return demoBooks.slice(); }
  try{ return JSON.parse(raw); } catch(e){ return demoBooks.slice(); }
}
function saveBooksForUser(){ localStorage.setItem(storeKeyFor(currentUser), JSON.stringify(books)); }

// login modal
loginBtn.addEventListener('click', ()=> { loginModal.hidden = false; });
loginClose.addEventListener('click', ()=> { loginModal.hidden = true; });
loginForm.addEventListener('submit', (e)=> {
  e.preventDefault();
  const name = document.getElementById('username').value.trim();
  if(!name){ alert('Enter username'); return; }
  const safe = name.replace(/\s+/g,'_').toLowerCase();
  currentUser = safe;
  localStorage.setItem('smart_current_user', currentUser);
  if(!localStorage.getItem(storeKeyFor(currentUser))){
    localStorage.setItem(storeKeyFor(currentUser), JSON.stringify(demoBooks));
  }
  books = loadBooksForUser(currentUser);
  updateUI();
  loginModal.hidden = true;
});

// helpers
function uid(){ return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function esc(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// categories
function getCategories(){
  const set = new Set(['Programming','Fiction','Science','Comics','History','Self-Help','Non-fiction']);
  books.forEach(b=> { if(b.category && b.category.trim()) set.add(b.category.trim()); });
  return Array.from(set).sort();
}
function populateCategoryControls(){
  const cats = getCategories();
  categoryFilter.innerHTML = `<option value="">All categories</option>` + cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  categoryChips.innerHTML = `<div class="chip active" data-cat="">All</div>` + cats.map(c=>`<div class="chip" data-cat="${esc(c)}">${esc(c)}</div>`).join('');
  categoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', ()=> {
      const cat = chip.getAttribute('data-cat');
      categoryFilter.value = cat;
      categoryChips.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active', x===chip));
      renderBooks();
    });
  });
}

// suggestions
function updateSuggestions(q){
  if(!q){ suggestionsBox.hidden = true; return; }
  const ql = q.toLowerCase();
  const hits = books.filter(b => (b.title||'').toLowerCase().includes(ql) || (b.author||'').toLowerCase().includes(ql)).slice(0,6);
  if(hits.length===0){ suggestionsBox.hidden = true; return; }
  suggestionsBox.innerHTML = '';
  hits.forEach(h => {
    const div = document.createElement('div');
    div.textContent = `${h.title} — ${h.author}`;
    div.className = 'suggestion-item';
    div.addEventListener('click', ()=> { searchInput.value = h.title; suggestionsBox.hidden = true; renderBooks(); });
    suggestionsBox.appendChild(div);
  });
  suggestionsBox.hidden = false;
}

// render list
function renderBooks(){
  const q = (searchInput.value||'').trim().toLowerCase();
  const cat = (categoryFilter.value||'').trim().toLowerCase();
  const favOnly = document.getElementById('show-favorites-only').checked;
  const issuedOnly = document.getElementById('show-issued-only').checked;

  const list = books.filter(b=>{
    let ok = true;
    if(q) ok = ((b.title||'').toLowerCase().includes(q) || (b.author||'').toLowerCase().includes(q));
    if(cat) ok = ok && ((b.category||'').toLowerCase() === cat);
    if(favOnly) ok = ok && b.favourite;
    if(issuedOnly) ok = ok && b.issued;
    return ok;
  });

  totalCount.textContent = books.length;
  visibleCount.textContent = list.length;

  if(list.length === 0){ booksContainer.innerHTML = '<p style="opacity:.7">No books found.</p>'; return; }

  booksContainer.innerHTML = '';
  list.forEach(b => {
    const node = cardTemplate.content.cloneNode(true);
    const art = node.querySelector('article.card');
    const img = node.querySelector('img.thumb');
    const titleEl = node.querySelector('.book-title');
    const authorEl = node.querySelector('.book-author');
    const descEl = node.querySelector('.book-desc');
    const extraEl = node.querySelector('.book-extra');
    const issueBtn = node.querySelector('.btn.issue');
    const reviewBtn = node.querySelector('.btn.review');
    const progBtn = node.querySelector('.btn.progress');
    const favBtn = node.querySelector('.btn.favourite');
    const pdfBtn = node.querySelector('.btn.pdf');
    const delBtn = node.querySelector('.btn.delete');

    img.src = b.image || `https://picsum.photos/seed/${encodeURIComponent(b.title||'book')}/600/400`;
    img.alt = b.title || 'cover';
    titleEl.textContent = b.title;
    authorEl.textContent = `${b.author} • ${b.category || 'General'}`;
    descEl.textContent = b.description || '';
    extraEl.innerHTML = `${b.issued ? `<span class="pill issued">Issued</span> to <strong>${esc(b.borrower||'')}</strong>` : `<span class="pill available">Available</span>` } &nbsp;&nbsp; Rating: ${b.rating||0} ⭐ &nbsp; Progress: ${b.progress||0}%`;

    issueBtn.textContent = b.issued ? 'Return' : 'Issue';
    favBtn.textContent = b.favourite ? '★' : '☆';
    pdfBtn.style.display = b.pdf ? 'inline-block' : 'none';

    // handlers
    issueBtn.addEventListener('click', ()=>{
      if(b.issued){
        if(confirm('Mark as returned?')){ b.issued = false; b.borrower = null; saveAndRender(); }
      } else {
        const borrower = prompt('Borrower name:');
        if(borrower){ b.issued = true; b.borrower = borrower; saveAndRender(); }
      }
    });

    reviewBtn.addEventListener('click', ()=>{
      const rating = Number(prompt('Rating 1-5 (leave blank to skip):','5'));
      const text = prompt('Short review (optional):','');
      if(rating && rating>=1 && rating<=5){ b.rating = Math.round(((b.rating||0) + rating)/2); }
      if(text && text.trim()){ b.reviews = b.reviews || []; b.reviews.unshift({by: currentUser, text: text.trim(), at: new Date().toISOString()}); }
      saveAndRender();
      alert('Thanks — review added.');
    });

    progBtn.addEventListener('click', ()=>{
      const p = Number(prompt('Reading progress (0-100)%', b.progress || 0));
      if(!isNaN(p) && p>=0 && p<=100){ b.progress = Math.round(p); saveAndRender(); }
    });

    favBtn.addEventListener('click', ()=>{ b.favourite = !b.favourite; saveAndRender(); });

    pdfBtn.addEventListener('click', ()=>{ if(b.pdf){ pdfFrame.src = b.pdf; pdfModal.hidden = false; } });

    delBtn.addEventListener('click', ()=>{ if(confirm('Delete this book?')){ books = books.filter(x=>x.id!==b.id); saveAndRender(); populateCategoryControls(); } });

    booksContainer.appendChild(node);
  });

  // stagger animation
  document.querySelectorAll('.card').forEach((c,i)=>{ c.style.opacity=0; c.style.transform='translateY(6px)'; setTimeout(()=>{ c.style.transition='all .26s ease'; c.style.opacity=1; c.style.transform='translateY(0)'; }, i*40); });
}

// save helper
function saveAndRender(){ saveBooksForUser(); renderBooks(); populateCategoryControls(); }

// form - add book
bookForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const category = document.getElementById('category').value.trim();
  const image = document.getElementById('image').value.trim();
  const pdf = document.getElementById('pdf').value.trim();
  const description = document.getElementById('description').value.trim();
  if(!title || !author){ alert('Title & Author required'); return; }
  const b = { id: uid(), title, author, category, image, pdf, description, reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 };
  books.unshift(b);
  saveAndRender();
  bookForm.reset();
});

// search + suggestions + filters
searchInput.addEventListener('input', e => { updateSuggestions(e.target.value); renderBooks(); });
searchInput.addEventListener('focus', ()=> updateSuggestions(searchInput.value));
searchInput.addEventListener('blur', ()=> setTimeout(()=> suggestionsBox.hidden = true, 200));
categoryFilter.addEventListener('change', ()=> { categoryChips.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active', x.dataset.cat === categoryFilter.value)); renderBooks(); });
document.getElementById('show-favorites-only').addEventListener('change', ()=> renderBooks());
document.getElementById('show-issued-only').addEventListener('change', ()=> renderBooks());

// pdf modal handlers
pdfClose.addEventListener('click', ()=> { pdfModal.hidden = true; pdfFrame.src = ''; });
pdfModal.addEventListener('click', (e)=> { if(e.target === pdfModal){ pdfModal.hidden = true; pdfFrame.src = ''; } });

// initial UI
function updateUI(){
  currentUserSpan.textContent = currentUser === 'guest' ? '' : `User: ${currentUser}`;
  populateCategoryControls();
  renderBooks();
}
// save/load wrappers
function saveBooksForUser(){ localStorage.setItem(storeKeyFor(currentUser), JSON.stringify(books)); }
if(!localStorage.getItem(storeKeyFor(currentUser))){ localStorage.setItem(storeKeyFor(currentUser), JSON.stringify(demoBooks)); books = demoBooks.slice(); saveBooksForUser(); }
updateUI();

/* helper: store key */
function storeKeyFor(user){ return STORAGE_PREFIX + user; }



