const STORAGE_KEY = 'smartLibraryBooks_v2';
let books = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const bookForm = document.getElementById('book-form');
const booksContainer = document.getElementById('books');
const searchInput = document.getElementById('search');

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

  booksContainer.innerHTML = list.map(createCardHTML).join('');
  // subtle animation: fade-in
  document.querySelectorAll('.card').forEach((c,i)=>{
    c.style.opacity = 0;
    c.style.transform = 'translateY(6px)';
    setTimeout(()=>{c.style.transition = 'all 260ms ease'; c.style.opacity = 1; c.style.transform = 'translateY(0)';}, 60 * i);
  });
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

bookForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const category = document.getElementById('category').value.trim();
  if(!title || !author) return alert('Please enter title and author');
  const book = { id: Date.now().toString(), title, author, category, issued:false, borrower:null };
  books.unshift(book);
  saveBooks();
  renderBooks(searchInput.value);
  bookForm.reset();
});

booksContainer.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if(!card) return;
  const id = card.dataset.id;
  const idx = books.findIndex(b => b.id === id);
  if(idx === -1) return;
  const book = books[idx];

  if(e.target.classList.contains('delete')){
    if(confirm('Delete this book?')){
      books.splice(idx,1);
      saveBooks();
      renderBooks(searchInput.value);
    }
  } else if(e.target.classList.contains('issue')){
    const borrower = prompt('Enter borrower name:');
    if(borrower){
      books[idx].issued = true;
      books[idx].borrower = borrower;
      books[idx].issuedDate = new Date().toISOString();
      saveBooks();
      renderBooks(searchInput.value);
    }
  } else if(e.target.classList.contains('return')){
    if(confirm('Mark as returned?')){
      books[idx].issued = false;
      books[idx].borrower = null;
      books[idx].issuedDate = null;
      saveBooks();
      renderBooks(searchInput.value);
    }
  }
});

searchInput.addEventListener('input', e => renderBooks(e.target.value));

// initial render
renderBooks();
