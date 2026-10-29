const euro = n => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n/100);
const cartKey='amore-cart-v1';
let products=[];
let cart=[];
try{cart=JSON.parse(localStorage.getItem(cartKey)||'[]');if(!Array.isArray(cart))cart=[];}catch{cart=[];}
const $=id=>document.getElementById(id);
const persist=()=>{localStorage.setItem(cartKey,JSON.stringify(cart));renderCart();};
function openCart(open){$('cart').classList.toggle('open',open);$('overlay').hidden=!open;$('cart').setAttribute('aria-hidden',String(!open));}
$('bagButton').onclick=()=>openCart(true);$('closeCart').onclick=()=>openCart(false);$('overlay').onclick=()=>openCart(false);
function renderProducts(){ $('products').replaceChildren(...products.map((p,i)=>{let card=document.createElement('article');let color=i===1?'grey':i===2?'tee':'';card.innerHTML=`<div class="product-photo"><span class="demo">CONCEPT VISUAL — NOT A PRODUCT PHOTO</span><div class="mock-shirt ${color}"><span>AMORE</span></div>${p.id==='longsleeve-black'?'<img class="real-product-image" src="/amore-longsleeve.png" alt="AMORE LONGSLEEVE zwart met witte opdruk" onerror="this.remove()">':''}</div><div class="product-data"><div><h3></h3><p></p></div><span class="price"></span></div><div class="product-controls"><select aria-label="Kies maat"></select><button>ADD TO BAG +</button></div>`;if(p.id==='longsleeve-black'){const photo=card.querySelector('.product-photo');photo.setAttribute('role','button');photo.setAttribute('tabindex','0');photo.setAttribute('aria-label','Bekijk AMORE LONGSLEEVE details');photo.onclick=()=>openProduct(p);photo.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProduct(p)}};const nameLink=card.querySelector('h3');nameLink.classList.add('product-name-link');nameLink.onclick=()=>openProduct(p);} card.querySelector('h3').textContent=p.name;card.querySelector('.product-data p').textContent=p.color;card.querySelector('.price').textContent=euro(p.price);let select=card.querySelector('select');p.sizes.forEach(s=>select.add(new Option(s,s)));card.querySelector('button').onclick=()=>{let item=cart.find(x=>x.id===p.id&&x.size===select.value);if(item)item.quantity=Math.min(10,item.quantity+1);else cart.push({id:p.id,size:select.value,quantity:1});persist();openCart(true);};return card;}));}

function openProduct(p){
  if(p.id!=='longsleeve-black')return;
  document.getElementById('productDetail')?.remove();
  const modal=document.createElement('div');
  modal.id='productDetail';modal.className='product-detail-backdrop';modal.setAttribute('role','presentation');
  modal.innerHTML=`<section class="product-detail" role="dialog" aria-modal="true" aria-labelledby="detailTitle">
    <button class="detail-close" type="button" aria-label="Sluit productdetails">✕</button>
    <div class="detail-gallery"><img src="/amore-longsleeve.png" alt="AMORE LONGSLEEVE — zwarte longsleeve met witte AMORE print" /></div>
    <div class="detail-info">
      <p class="detail-kicker">AMORE / THE FIRST DROP</p>
      <h2 id="detailTitle">AMORE LONGSLEEVE</h2>
      <p class="detail-color">WASHED BLACK · WHITE PRINT</p>
      <p class="detail-price"></p>
      <p class="detail-description">Een minimalistische heavyweight longsleeve met de kenmerkende AMORE-print op de borst. Gemaakt voor een comfortabele boxy fit.</p>
      <div class="detail-spec"><span>350 GSM</span><span>100% KATOEN</span><span>BOXY FIT</span></div>
      <label class="detail-label" for="detailSize">SELECT SIZE</label>
      <select id="detailSize" aria-label="Kies maat"></select>
      <button class="detail-add" type="button">ADD TO BAG +</button>
      <p class="detail-note">Product en prijs zijn nog een preview. Betalen wordt later geactiveerd.</p>
    </div>
  </section>`;
  document.body.append(modal);document.body.classList.add('detail-open');
  modal.querySelector('.detail-price').textContent=euro(p.price);
  const select=modal.querySelector('#detailSize');p.sizes.forEach(s=>select.add(new Option(s,s)));
  const close=()=>{modal.remove();document.body.classList.remove('detail-open');document.removeEventListener('keydown',onKey)};
  const onKey=e=>{if(e.key==='Escape')close()};
  modal.querySelector('.detail-close').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',onKey);
  modal.querySelector('.detail-add').onclick=()=>{let item=cart.find(x=>x.id===p.id&&x.size===select.value);if(item)item.quantity=Math.min(10,item.quantity+1);else cart.push({id:p.id,size:select.value,quantity:1});persist();close();openCart(true)};
  modal.querySelector('.detail-close').focus();
}

function renderCart(){cart=cart.filter(c=>products.some(p=>p.id===c.id&&p.sizes.includes(c.size))&&c.quantity>0);let count=cart.reduce((t,x)=>t+x.quantity,0);$('cartCount').textContent=`(${count})`;$('bagCount').textContent=`(${count})`;let total=0;$('cartLines').replaceChildren();for(const c of cart){const p=products.find(x=>x.id===c.id);total+=c.quantity*p.price;const item=document.createElement('div');item.className='cart-item';const description=document.createElement('div');const name=document.createElement('strong');name.textContent=p.name;const meta=document.createElement('p');meta.textContent=`${p.color} · ${c.size} · Aantal: ${c.quantity}`;const rm=document.createElement('button');rm.textContent='VERWIJDER';rm.onclick=()=>{cart=cart.filter(x=>x!==c);persist()};description.append(name,meta,rm);const price=document.createElement('strong');price.textContent=euro(c.quantity*p.price);item.append(description,price);$('cartLines').append(item);}if(!cart.length)$('cartLines').innerHTML='<p class="empty">YOUR BAG IS EMPTY.</p>';$('subtotal').textContent=euro(total);$('checkout').disabled=!cart.length;}
$('checkout').onclick=async()=>{const b=$('checkout');b.disabled=true;$('checkoutMsg').textContent='Betaling wordt voorbereid…';try{const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart})});const data=await r.json();if(!r.ok)throw Error(data.error||'Er is iets misgegaan');window.location.href=data.checkoutUrl;}catch(e){$('checkoutMsg').textContent=e.message;b.disabled=false;}};
async function init(){try{const r=await fetch('/api/products');if(!r.ok)throw Error();products=await r.json();renderProducts();renderCart();}catch{$('products').textContent='De producten konden niet worden geladen. Start de Node-server.';}}
const orderId=new URLSearchParams(location.search).get('order');if(orderId&&/^[0-9a-f-]{36}$/i.test(orderId)){fetch(`/api/order/${encodeURIComponent(orderId)}`).then(r=>r.json()).then(data=>{if(data.status==='paid'){alert('Betaling bevestigd! Bedankt voor je bestelling.');cart=[];localStorage.removeItem(cartKey);renderCart();}else alert(`Betalingsstatus: ${data.status||'onbekend'}. Alleen “paid” is een betaalbevestiging.`);}).catch(()=>{});history.replaceState({},'',location.pathname);}
init();
