/* Reset + base */
*{box-sizing:border-box}
html,body,#root{height:100%}
body{margin:0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial;color:#0f172a;background:linear-gradient(180deg,#f8fafc 0%, #eef2f7 100%);-webkit-font-smoothing:antialiased}

.app{min-height:100vh;display:flex;flex-direction:column}

/* HERO */
.hero{background:linear-gradient(135deg,#2563eb 0%, #7c3aed 100%);color:white;padding:44px 20px;border-bottom-left-radius:18px;border-bottom-right-radius:18px}
.hero-inner{max-width:1100px;margin:0 auto;text-align:center}
.title{font-size:28px;margin:0 0 6px;font-weight:700;letter-spacing:-0.5px}
.subtitle{margin:0 0 18px;opacity:0.95}
.search-row{max-width:720px;margin:0 auto}
.search-row input{width:100%;padding:12px 14px;border-radius:10px;border:none;outline:none;font-size:14px}

/* CONTAINER */
.container{max-width:1100px;margin:22px auto;padding:0 16px;flex:1}
.panel{background:linear-gradient(180deg,#ffffff 0%, #fbfdff 100%);padding:12px;border-radius:12px;box-shadow:0 6px 18px rgba(15,23,42,0.06);margin-bottom:16px}
.form-inline{display:flex;gap:10px;flex-wrap:wrap}
.form-inline input{flex:1;min-width:160px;padding:10px 12px;border-radius:8px;border:1px solid #e6eef9;background:#fff}
.primary{background:#2563eb;color:white;border:none;padding:10px 14px;border-radius:8px;cursor:pointer}
.primary:active{transform:translateY(1px)}

/* BOOK GRID */
.books{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:12px}
.card{background:white;border-radius:12px;padding:14px;border:1px solid rgba(15,23,42,0.04);display:flex;flex-direction:column;gap:8px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.card:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(2,6,23,0.08);border-color:rgba(124,58,237,0.12)}
.card .meta{color:#475569;font-size:13px}
.card strong{font-size:15px}
.actions{display:flex;gap:8px;margin-top:auto}
.btn{padding:8px 10px;border-radius:8px;border:none;cursor:pointer;font-weight:600}
.btn.issue{background:#10b981;color:white}
.btn.return{background:#f97316;color:white}
.btn.delete{background:#ef4444;color:white}

/* small status pill */
.pill{display:inline-block;padding:6px 8px;border-radius:999px;font-size:12px}
.pill.available{background:rgba(16,185,129,0.12);color:#065f46}
.pill.issued{background:rgba(249,115,22,0.12);color:#7c2d12}

.footer{text-align:center;color:#64748b;padding:18px 6px}

/* responsive tweaks */
@media (max-width:640px){
  .title{font-size:22px}
  .form-inline{flex-direction:column}
  .form-inline input{width:100%}
}

searchInput.addEventListener('input', e => renderBooks(e.target.value));

// initial render
renderBooks();
