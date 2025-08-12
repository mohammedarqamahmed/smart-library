/* Smart Library — 10 features implementation (frontend-only) */
const THEME_KEY = 'smartTheme_v1';
const STORAGE_KEY = 'smartBooks_v10';

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
const cardTemplate = document.getElementById('card-template');

// demo books if none
const demoBooks = [
  { id:'b1', title:'Clean Code', author:'Robert C. Martin', category:'Programming', description:'A handbook of agile software craftsmanship.', image:'https://picsum.photos/seed/clean/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id:'b2', title:'Eloquent JavaScript', author:'Marijn Haverbeke', category:'Programming', description:'A modern intro to programming.', image:'https://picsum.photos/seed/elo/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id:'b3', title:'The Alchemist', author:'Paulo Coelho', category:'Fiction', description:'A tale about following your dreams.', image:'https://picsum.photos/seed/alc/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id:'b4', title:'Brief History of Time', author:'Stephen Hawking', category:'Science', description:'From the Big Bang to black holes.', image:'https://picsum.photos/seed/brief/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
  { id:'b5', title:'Sapiens', author:'Yuval Noah Harari', category:'History', description:'A brief history of humankind.', image:'https://picsum.photos/seed/sap/600/400', pdf:'', reviews:[], rating:0, favourite:false, issued:false, borrower:null, progress:0 },
];

// state
let books = JSON.parse(localStorage.getItem(STORAGE_KEY)) || demoBooks.slice();
saveBooks();

// THEME
function getPreferredTheme(){ const s = localStorage.getItem(THEME_KEY); if(s) return s; return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; }
function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); localStorage.setItem(THEME_KEY, t); }
themeToggle.addEventListener('click', ()=> applyTheme(document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark'));
applyTheme(getPreferredTheme());

// helpers
function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function esc(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function saveBooks(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(books)); }

// categories
function getCategories(){ const s = new Set(['Programming','Fiction','Science','Comics','History','Self-Help','Non-fiction']); books.forEach(b=>{ if(b.category && b.category.trim()) s.add(b.category.trim()); }); return Array.from(s).sort(); }
function populateCategories(){ const cats = getCategories(); categoryFilter.innerHTML = `<option value="">All categories</option>` + cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(''); categoryChips.innerHTML = `<div class="chip active" data-cat="">All</div>` + cats.map(c=>`<div class="chip" data-cat="${esc(c)}">${esc(c)}</div>`).join(''); categoryChips.querySelectorAll('.chip').forEach(chip=>{ chip.addEventListener('click', ()=>{ categoryFilter.value = chip.dataset.cat; categoryChips.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active', x===chip)); renderBooks(); }); }); }

// suggestions
function updateSuggestions(q){ if(!q){ suggestionsBox.hidden = true; return; } const ql = q.toLowerCase(); const hits = books.filter(b => (b.title||'').toLowerCase().includes(ql) || (b.author||'').toLowerCase().includes(ql)).slice(0,6); if(hits.length===0){ suggestionsBox.hidden = true; return; } suggestionsBox.innerHTML = ''; hits.forEach(h=>{ const d=document.createElement('div'); d.textContent = `${h.title} — ${h.author}`; d.addEventListener('click', ()=>{ searchInput.value = h.title; suggestionsBox.hidden=true; renderBooks(); }); suggestionsBox.appendChild(d); }); suggestionsBox.hidden = false; }

// render books
function renderBooks(){
  const q = (searchInput.value||'').trim().toLowerCase();
  const cat = (categoryFilter.value||'').trim().toLowerCase();
  const favOnly = document.getElementById('show-favorites-only').checked;
  const issuedOnly = document.getElementById('show-issued-only').checked;

  let list = books.filter(b=>{
    let ok = true;
    if(q) ok = ((b.title||'').toLowerCase().includes(q) || (b.author||'').toLowerCase().includes(q));
    if(cat) ok = ok && ((b.category||'').toLowerCase() === cat);
    if(favOnly) ok = ok && b.favourite;
    if(issuedOnly) ok = ok && b.issued;
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
    extra.innerHTML = `${b.issued ? `<span class="pill issued">Issued</span> to <strong>${esc(b.borrower||'')}</strong>` : `<span class="pill available">Available</span>` } &nbsp;&nbsp;<span class="muted">Rating: ${b.rating||0} ⭐</span> &nbsp; Progress: ${b.progress||0}%`;

    issueBtn.textContent = b.issued ? 'Return' : 'Issue';
    favBtn.textContent = b.favourite ? '★' : '☆';
    pdfBtn.style.display = b.pdf ? 'inline-block' : 'none';

    issueBtn.addEventListener('click', ()=>{
      if(b.issued){
        if(confirm('Mark as returned?')){ b.issued=false; b.borrower=null; saveBooks(); renderBooks(); }
      } else {
        const borrower = prompt('Borrower name:');
        if(borrower){ b.issued=true; b.borrower = borrower; saveBooks(); renderBooks(); }
      }
    });

    reviewBtn.addEventListener('click', ()=>{
      const rating = Number(prompt('Rating 1-5 (leave blank to skip):','5'));
      const text = prompt('Short review (optional):','');
      if(rating && rating>=1 && rating<=5){ b.rating = Math.round(((b.rating||0) + rating)/2); }
      if(text && text.trim()){ b.reviews = b.reviews || []; b.reviews.unshift({by:'guest', text: text.trim(), at: new Date().toISOString()}); }
      saveBooks(); renderBooks();
      alert('Thanks — review added.');
    });

    progressBtn.addEventListener('click', ()=>{
      const p = Number(prompt('Reading progress (0-100)%', b.progress || 0));
      if(!isNaN(p) && p>=0 && p<=100){ b.progress = Math.round(p); saveBooks(); renderBooks(); }
    });

    favBtn.addEventListener('click', ()=>{ b.favourite = !b.favourite; saveBooks(); renderBooks(); });

    pdfBtn.addEventListener('click', ()=>{ if(b.pdf){ pdfFrame.src = b.pdf; pdfModal.hidden = false; } });

    deleteBtn.addEventListener('click', ()=>{ if(confirm('Delete this book?')){ books = books.filter(x=>x.id!==b.id); saveBooks(); populateCategories(); renderBooks(); } });

    booksContainer.appendChild(node);
  });

  // small stagger
  document.querySelectorAll('.card').forEach((c,i)=>{ c.style.opacity=0; c.style.transform='translateY(6px)'; setTimeout(()=>{ c.style.transition='all .26s ease'; c.style.opacity=1; c.style.transform='translateY(0)'; }, i*40); });
}

// add book
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
  books.unshift(b); saveBooks(); populateCategories(); renderBooks(); bookForm.reset();
});

// search + suggestions + filters
searchInput.addEventListener('input', e=>{ updateSuggestions(e.target.value); renderBooks(); });
searchInput.addEventListener('focus', ()=> updateSuggestions(searchInput.value));
searchInput.addEventListener('blur', ()=> setTimeout(()=> suggestionsBox.hidden=true, 200));
categoryFilter.addEventListener('change', ()=> { categoryChips.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active', x.dataset.cat === categoryFilter.value)); renderBooks(); });
document.getElementById('show-favorites-only').addEventListener('change', ()=> renderBooks());
document.getElementById('show-issued-only').addEventListener('change', ()=> renderBooks());

// pdf modal
pdfClose.addEventListener('click', ()=>{ pdfModal.hidden = true; pdfFrame.src=''; });
pdfModal.addEventListener('click', e=>{ if(e.target===pdfModal){ pdfModal.hidden=true; pdfFrame.src=''; } });

// populate cats + initial
function populateCategories(){ const cats = getCategories(); categoryFilter.innerHTML = `<option value="">All categories</option>` + cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(''); categoryChips.innerHTML = `<div class="chip active" data-cat="">All</div>` + cats.map(c=>`<div class="chip" data-cat="${esc(c)}">${esc(c)}</div>`).join(''); categoryChips.querySelectorAll('.chip').forEach(chip=>{ chip.addEventListener('click', ()=>{ categoryFilter.value = chip.dataset.cat; categoryChips.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active', x===chip)); renderBooks(); }); }); }

// initial save & UI
function saveBooks(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(books)); }
function getCategories(){ const s=new Set(['Programming','Fiction','Science','Comics','History','Self-Help','Non-fiction']); books.forEach(b=>{ if(b.category && b.category.trim()) s.add(b.category.trim()); }); return Array.from(s).sort(); }
populateCategories();
renderBooks();
saveBooks();

