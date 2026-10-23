'use strict';

// Catálogo estático en el frontend: es intencional, según el enunciado del reto.
// Imágenes editoriales externas para la demo, con fondo de respaldo en CSS.
const productos = [
  { id: 1, nombre: 'Camisa Relaxed Oxford', categoria: 'Hombre', precio: 119, tono: 'Sand', etiqueta: 'BEST SELLER', foto: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=900&auto=format&fit=crop&q=80' },
  { id: 2, nombre: 'Blazer Soft Structure', categoria: 'Mujer', precio: 229, tono: 'Ash', etiqueta: 'NUEVO', foto: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&auto=format&fit=crop&q=80' },
  { id: 3, nombre: 'Básico Essential Tee', categoria: 'Unisex', precio: 69, tono: 'Cloud', etiqueta: '', foto: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80' },
  { id: 4, nombre: 'Denim Everyday', categoria: 'Mujer', precio: 169, tono: 'Blue', etiqueta: 'POPULAR', foto: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80' },
  { id: 5, nombre: 'Hoodie Urban', categoria: 'Unisex', precio: 149, tono: 'Stone', etiqueta: 'NUEVO', foto: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=80' },
  { id: 6, nombre: 'Chompa Classic Knit', categoria: 'Hombre', precio: 139, tono: 'Warm', etiqueta: '', foto: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80' }
];
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
let activeFilter = 'Todos';
let cart = [];
try { const persisted = JSON.parse(localStorage.getItem('lumera-cart-v1') || '[]'); if (Array.isArray(persisted)) cart = persisted.filter(x => Number.isInteger(x) && productos.some(p=>p.id===x)).slice(0,100); } catch { cart = []; }
let toastTimer;

async function loadPromotion() {
  try {
    const res = await fetch('/api/promocion', { cache: 'no-store' });
    const data = await res.json();
    $('promoText').textContent = data.mensaje || 'Descubre nuestra nueva colección';
    const isLive = res.ok && data.fuente === 'azure-blob';
    $('promoSource').textContent = isLive ? 'EN VIVO' : 'DEMO';
    $('promoSource').title = isLive ? 'Mensaje leído desde Azure Blob Storage' : 'Banner de demostración; Blob Storage no está conectado o no respondió';
  } catch {
    $('promoText').textContent = 'Descubre nuestra nueva colección';
    $('promoSource').textContent = 'DEMO';
    $('promoSource').title = 'Sin conexión a la API';
  }
}
function showToast(message) {
  const e = $('toast'); e.textContent = message; e.classList.add('visible');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>e.classList.remove('visible'), 3000);
}
function renderProducts() {
  const term = $('searchInput').value.trim().toLowerCase();
  const filtered = productos.filter(p => (activeFilter === 'Todos' || p.categoria === activeFilter) && (!term || `${p.nombre} ${p.categoria}`.toLowerCase().includes(term)));
  $('productGrid').replaceChildren();
  if (!filtered.length) { const empty=document.createElement('p'); empty.className='empty-catalog'; empty.textContent='No encontramos prendas con esa búsqueda.'; $('productGrid').append(empty); return; }
  for (const p of filtered) {
    const card=document.createElement('article'); card.className='product-card';
    card.innerHTML=`<div class="product-image product-color-${p.id}"><img src="${p.foto}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none'">${p.etiqueta?`<span class="product-badge">${p.etiqueta}</span>`:''}<button class="quick-add" type="button" aria-label="Agregar ${p.nombre} a la bolsa">+</button></div><div class="product-info"><div><p class="product-type">${p.categoria} · ${p.tono}</p><h3>${p.nombre}</h3></div><strong>${money(p.precio)}</strong></div>`;
    card.querySelector('button').addEventListener('click',()=>addToCart(p.id)); $('productGrid').append(card);
  }
}
function updateCart() {
  const qty=cart.length; $('cartCount').textContent=String(qty); $('drawerCount').textContent=`(${qty})`;
  const ids=[...new Set(cart)]; $('cartItems').replaceChildren();
  if (!ids.length) {const empty=document.createElement('div');empty.className='empty-cart';empty.textContent='Tu bolsa está vacía. Encuentra algo que te guste ✳'; $('cartItems').append(empty);}
  for(const id of ids){const p=productos.find(x=>x.id===id), count=cart.filter(x=>x===id).length; const item=document.createElement('div');item.className='cart-item';item.innerHTML=`<div class="cart-thumb product-color-${id}"><img src="${p.foto}" alt="" loading="lazy" onerror="this.style.display='none'"></div><div class="cart-copy"><strong>${p.nombre}</strong><span>${count} × ${money(p.precio)}</span><button type="button" class="remove-item">Quitar uno</button></div><strong>${money(p.precio*count)}</strong>`;item.querySelector('.remove-item').addEventListener('click',()=>removeFromCart(id));$('cartItems').append(item);}
  $('cartSubtotal').textContent=money(cart.reduce((sum,id)=>sum+productos.find(p=>p.id===id).precio,0));
  localStorage.setItem('lumera-cart-v1',JSON.stringify(cart));
}
function addToCart(id){cart.push(id); updateCart(); showToast('Agregado a tu bolsa ✳');}
function removeFromCart(id){const i=cart.indexOf(id);if(i>=0)cart.splice(i,1);updateCart();}
function openCart(){ $('drawerOverlay').classList.remove('hidden');$('cartDrawer').classList.add('open');$('cartDrawer').setAttribute('aria-hidden','false');$('closeCart').focus();}
function closeCart(){ $('drawerOverlay').classList.add('hidden');$('cartDrawer').classList.remove('open');$('cartDrawer').setAttribute('aria-hidden','true');$('cartBtn').focus();}
for(const b of document.querySelectorAll('[data-filter]'))b.addEventListener('click',()=>{activeFilter=b.dataset.filter;for(const x of document.querySelectorAll('[data-filter]')){const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));}renderProducts();});
$('searchBtn').addEventListener('click',()=>{const wrap=$('searchWrap');wrap.classList.toggle('hidden');if(!wrap.classList.contains('hidden')){$('searchInput').focus();document.querySelector('#coleccion').scrollIntoView({behavior:'smooth'});}else{$('searchInput').value='';renderProducts();}});
$('searchInput').addEventListener('input',renderProducts);
$('cartBtn').addEventListener('click',openCart);$('closeCart').addEventListener('click',closeCart);$('drawerOverlay').addEventListener('click',closeCart);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('cartDrawer').classList.contains('open'))closeCart();});
$('checkoutBtn').addEventListener('click',()=>showToast('Esta es una demostración. No se realizan pagos.'));
renderProducts();updateCart();loadPromotion();
// Al regresar a la página, actualizamos el banner sin necesitar redeploy.
document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadPromotion();});
