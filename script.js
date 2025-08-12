const STORAGE_KEY = 'smartLibraryBooks';
let books = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const bookForm = document.getElementById('book-form');
const booksContainer = document.getElementById('books');
const searchInput = document.getElementById('search');

function saveBooks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function renderBooks(filter = ''){
  const q = filter.trim().toLowerCase();
  const list = books.filter(b => {
    if(!q) return true;
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  });

  if(list.length === 0){
    booksContainer.innerHTML = '<p style="grid-column:1/-1;opacity:0.8">No books added yet.</p>';
    return;
  }

  booksContainer.innerHTML = list.map(b => `
    <div class="card" data-id="${b.id}">
      <div>
        <strong>${escapeHtml(b.title)}</strong>
        <div class="meta">${escapeHtml(b.author)} • ${escapeHtml(b.category || 'General')}</div>
      </div>
      <div class="meta">Status: ${b.issued ? `<em>Issued to</em> ${escapeHtml(b.borrower || '-')}` : '<em>Available</em>'}</div>
      <div class="actions">
        <button class="btn ${b.issued ? 'return' : 'issue'}">${b.issued ? 'Return' : 'Issue'}</button>
        <button class="btn delete">Delete</button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str){
  if(!str) return '';
  return str.replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
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
  const book = books.find(b => b.id === id);
  if(e.target.classList.contains('delete')){
    if(confirm('Delete this book?')){
      books = books.filter(b => b.id !== id);
      saveBooks();
      renderBooks(searchInput.value);
    }
  } else if(e.target.classList.contains('issue')){
    const borrower = prompt('Enter borrower name:');
    if(borrower){
      book.issued = true;
      book.borrower = borrower;
      book.issuedDate = new Date().toISOString();
      saveBooks();
      renderBooks(searchInput.value);
    }
  } else if(e.target.classList.contains('return')){
    if(confirm('Mark as returned?')){
      book.issued = false;
      book.borrower = null;
      book.issuedDate = null;
      saveBooks();
      renderBooks(searchInput.value);
    }
  }
});

searchInput.addEventListener('input', e => renderBooks(e.target.value));

// initial render
renderBooks();
