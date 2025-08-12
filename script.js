/* Smart Library full features (frontend only) */
const THEME_KEY = 'smartTheme_v1';
const USERS_KEY = 'smartUsers_v1';
const STORAGE_PREFIX = 'smartBooks_'; // books stored per user: smartBooks_<username>

// DOM references
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const categoryChips = document.getElementById('category-chips');
const booksContainer = document.getElementById('books');
const bookForm = document.getElementById('book-form');
const visibleCount = document.getElementById('visible-count');
const totalCount = document.getElementById('total-count');
const themeToggle = document.getElementById('theme-toggle');
const suggestionsBox = document.getElementById('suggestions');
const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const loginClose = document.getElementById('login-close');
const loginForm = document.getElementById('login-form');
const currentUserSpan = document.getElementById('current-user');
const showFavoritesOnly = document.getElementById('show-favorites-only');
const showIssuedOnly = document.getElementById('show-issued-only');
const pdfModal = document.getElementById('pdf-modal');
const pdfClose = document.getElementById('pdf-close');
const pdfFrame = document.getElementById('pdf-frame');

// template
const cardTemplate = document.getElementById('card-template');

// demo books used only if user has no books
const demoBooks = [
  { id:'b1', title:'Clean Code', author:'Robert C. Martin', category:'Programming', description:'A handbook of agile software craftsmanship.', image:'https://picsum.photos/seed/clean/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id:'b2', title:'Eloquent JavaScript', author:'Marijn Haverbeke', category:'Programming', description:'A modern introduction to programming.', image:'https://picsum.photos/seed/elo/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id:'b3', title:'The Alchemist', author:'Paulo Coelho', category:'Fiction', description:'A tale about following your dreams.', image:'https://picsum.photos/seed/alc/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id:'b4', title:'Brief History of Time', author:'Stephen Hawking', category:'Science', description:'From the Big Bang to black holes.', image:'https://picsum.photos/seed/brief/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id:'b5', title:'Sapiens', author:'Yuval Noah Harari', category:'History', description:'A brief history of humankind.', image:'https://picsum.photos/seed/sap/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
];

// state
let currentUser = localStorage.getItem('smart_current_user') || 'guest';
let books = loadBooksForUser(currentUser);

// THEME
function getPreferredTheme(){
  const stored = localStorage.getItem(THEME_KEY);
  if(stored) return stored;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark':'light';
}
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
}
themeToggle.addEventListener('click', ()=> applyTheme(document.documentElement.getAttribute('data-theme')==='dark' ? 'light':'dark'));
applyTheme(getPreferredTheme());

// USER LOGIN (simple)
function openLogin(){ loginModal.hidden = false; }
function closeLogin(){ loginModal.hidden = true; }
loginBtn.addEventListener('click', openLogin);
loginClose.addEventListener('click', closeLogin);

loginForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = document.getElementById('username').value.trim();
  if(!name){ alert('Enter username'); return; }
  const safe = name.replace(/\s+/g,'_').toLowerCase();
  currentUser = safe;
  localStorage.setItem('smart_current_user', currentUser);
  // ensure user key exists
  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  if(!users.includes(safe)){ users.push(safe); localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  // if no books for user, seed demo
  if(!localStorage.getItem(STORAGE_PREFIX+safe)){
    localStorage.setItem(STORAGE_PREFIX+safe, JSON.stringify(demoBooks));
  }
  books = loadBooksForUser(currentUser);
  updateUI();
  closeLogin();
});

// load / save per user
function loadBooksForUser(user){
  const raw = localStorage.getItem(STORAGE_PREFIX + user);
  if(!raw){
    // if no books, seed demo for guest as well
    localStorage.setItem(STORAGE_PREFIX+user, JSON.stringify(demoBooks));
    return demoBooks.slice();
  }
  try { return JSON.parse(raw); } catch(e){ return []; }
}
function saveBooksForUser(){
  localStorage.setItem(STORAGE_PREFIX + currentUser, JSON.stringify(books));
}

// helpers
function uid(){ return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function esc(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// categories
function getCategories(){
  const set = new Set(['Programming','Fiction','Science','Comics','History','Self-Help','Non-fiction']);
  books.forEach(b => { if(b.category && b.category.trim()) set.add(b.category.trim()); });
  return Array.from(set).sort();
}
function populateCategoryControls(){
  const cats = getCategories();
  categoryFilter.innerHTML = `<option value="">All categories</option>` + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  categoryChips.innerHTML = `<div class="chip ${''=== '' ? 'active':''}" data-cat="">All</div>` + cats.map(c => `<div class="chip" data-cat="${esc(c)}">${esc(c)}</div>`).join('');
  categoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', ()=> {
      const cat = chip.getAttribute('data-cat');
      categoryFilter.value = cat;
      categoryChips.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active', x===chip));
      renderBooks();
    });
  });
}

// search suggestions
function updateSuggestions(q){
  if(!q){ suggestionsBox.hidden = true; return; }
  const ql = q.toLowerCase();
  const hits = books.filter(b => (b.title||'').toLowerCase().includes(ql) || (b.author||'').toLowerCase().includes(ql)).slice(0,6);
  if(hits.length===0){ suggestionsBox.hidden=true; return; }
  suggestionsBox.innerHTML = '';
  hits.forEach(h=>{
    const div = document.createElement('div');
    div.textContent = `${h.title} — ${h.author}`;
    div.addEventListener('click', ()=> { searchInput.value = h.title; suggestionsBox.hidden=true; renderBooks(); });
    suggestionsBox.appendChild(div);
  });
  suggestionsBox.hidden = false;
}

// render
function renderBooks(){
  const q = (searchInput.value||'').trim().toLowerCase();
  const cat = (categoryFilter.value||'').trim().toLowerCase();
  const showFav = showFavoritesOnly.checked;
  const showIss = showIssuedOnly.checked;

  const list = books.filter(b=>{
    let ok = true;
    if(q) ok = ((b.title||'').toLowerCase().includes(q) || (b.author||'').toLowerCase().includes(q));
    if(cat) ok = ok && ((b.category||'').toLowerCase() === cat);
    if(showFav) ok = ok && b.favourite;
    if(showIss) ok = ok && b.issued;
    return ok;
  });

  totalCount.textContent = books.length;
  visibleCount.textContent = list.length;

  if(list.length===0){ booksContainer.innerHTML = '<p style="opacity:.7">No books found.</p>'; return; }

  booksContainer.innerHTML = '';
  list.forEach(b=>{
    const node = cardTemplate.content.cloneNode(true);
    const art = node.querySelector('article.card');
    const img = node.querySelector('img.thumb');
    const title = node.querySelector('.book-title');
    const author = node.querySelector('.book-author');
    const desc = node.querySelector('.book-desc');
    const extra = node.querySelector('.book-extra');
    const issueBtn = node.querySelector('.btn.issue');
    const reviewBtn = node.querySelector('.btn.review');
    const progressBtn = node.querySelector('.btn.progress');
    const favBtn = node.querySelector('.btn.favourite');
    const pdfBtn = node.querySelector('.btn.pdf');
    const deleteBtn = node.querySelector('.btn.delete');

    img.src = b.image || `https://picsum.photos/seed/${encodeURIComponent(b.title||'book')}/600/400`;
    img.alt = b.title || 'cover';
    title.textContent = b.title;
    author.textContent = `${b.author} • ${b.category || 'General'}`;
    desc.textContent = b.description || '';
    extra.innerHTML = `${b.issued ? `<span class="pill issued">Issued</span> to <strong>${esc(b.borrower||'')}</strong>` : `<span class="pill available">Available</span>` } ` +
                      `&nbsp;&nbsp; <span class="muted">Rating: ${b.rating || 0} ⭐</span> &nbsp; Progress: ${b.progress || 0}%`;

    issueBtn.textContent = b.issued ? 'Return' : 'Issue';
    issueBtn.classList.toggle('return', b.issued);
    favBtn.textContent = b.favourite ? '★' : '☆';
    favBtn.title = b.favourite ? 'Unfavorite' : 'Add to favorites';
    pdfBtn.style.display = b.pdf ? 'inline-block' : 'none';

    // actions
    issueBtn.addEventListener('click', ()=>{
      if(b.issued){
        if(confirm('Mark as returned?')){ b.issued=false; b.borrower=null; saveAndRerender(); }
      } else {
        const borrower = prompt('Borrower name:');
        if(borrower){ b.issued=true; b.borrower = borrower; saveAndRerender(); }
      }
    });

    reviewBtn.addEventListener('click', ()=>{
      const rating = Number(prompt('Rating 1-5 (leave blank to skip):','5'));
      const text = prompt('Short review (optional):','');
      if(rating && rating>=1 && rating<=5){
        b.rating = Math.round(((b.rating||0) + rating)/2); // naive avg
      }
      if(text && text.trim()){
        b.reviews = b.reviews || []; b.reviews.unshift({by: currentUser, text: text.trim(), at: new Date().toISOString()});
      }
      saveAndRerender();
      alert('Thanks! Review added.');
    });

    progressBtn.addEventListener('click', ()=>{
      const p = Number(prompt('Reading progress (0-100)%', b.progress || 0));
      if(!isNaN(p) && p>=0 && p<=100){ b.progress = Math.round(p); saveAndRerender(); }
    });

    favBtn.addEventListener('click', ()=>{
      b.favourite = !b.favourite; saveAndRerender();
    });

    pdfBtn.addEventListener('click', ()=>{
      if(b.pdf){ pdfFrame.src = b.pdf; pdfModal.hidden = false; }
    });

    deleteBtn.addEventListener('click', ()=>{
      if(confirm('Delete this book?')){ books = books.filter(x=>x.id!==b.id); saveAndRerender(); populateCategoryControls(); }
    });

    // card click to show reviews in alert (quick)
    art.querySelector('.card-body').addEventListener('dblclick', ()=>{
      const rv = (b.reviews||[]).map(r => `${r.by}: ${r.text}`).join('\n\n') || 'No reviews';
      alert(`Reviews for "${b.title}":\n\n${rv}`);
    });

    booksContainer.appendChild(node);
  });

  // small stagger
  document.querySelectorAll('.card').forEach((c,i)=>{ c.style.opacity=0; c.style.transform='translateY(6px)'; setTimeout(()=>{c.style.transition='all .26s ease'; c.style.opacity=1; c.style.transform='translateY(0)';}, i*40); });
}

// save + rerender helper
function saveAndRerender(){ saveBooksForUser(); renderBooks(); populateCategoryControls(); }

// initial population: if user has no books seed demo
if(!books || books.length===0){ books = demoBooks.slice(); saveBooksForUser(); }

// populate categories + UI
function updateUI(){
  document.getElementById('current-user').textContent = currentUser==='guest' ? '' : `User: ${currentUser}`;
  populateCategoryControls();
  renderBooks();
}
populateCategoryControls();
renderBooks();
updateUI();

// form submit: add book
bookForm.addEventListener('submit', e=>{
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
  saveAndRerender();
  bookForm.reset();
  // show category active if new
  populateCategoryControls();
});

// search + suggestions + filter handlers
searchInput.addEventListener('input', e => { updateSuggestions(e.target.value); renderBooks(); });
searchInput.addEventListener('focus', ()=> updateSuggestions(searchInput.value));
searchInput.addEventListener('blur', ()=> setTimeout(()=> suggestionsBox.hidden=true, 200));
categoryFilter.addEventListener('change', ()=> renderBooks());
showFavoritesOnly.addEventListener('change', ()=> renderBooks());
showIssuedOnly.addEventListener('change', ()=> renderBooks());

// pdf modal
pdfClose.addEventListener('click', ()=> { pdfModal.hidden = true; pdfFrame.src = ''; });
pdfModal.addEventListener('click', (e)=> { if(e.target === pdfModal) { pdfModal.hidden = true; pdfFrame.src=''; } });

// helper save
function saveBooksForUser(){ localStorage.setItem(STORAGE_PREFIX + currentUser, JSON.stringify(books)); }

// first-time user setup for guest
if(!localStorage.getItem(STORAGE_PREFIX + currentUser)){ localStorage.setItem(STORAGE_PREFIX + currentUser, JSON.stringify(demoBooks)); books = demoBooks.slice(); saveBooksForUser(); }

// expose simple reset for dev (commented)
// localStorage.removeItem(STORAGE_PREFIX + 'guest'); location.reload();

// final UI init
updateUI();
