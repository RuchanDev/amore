import express from 'express';
import 'dotenv/config';
import crypto from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.json({limit:'30kb'}));
app.use(express.static('public'));

// DEMOPRODUCTEN: pas prijzen en voorraad aan voor livegang.
const products = [
  {id:'longsleeve-black',name:'AMORE Heavyweight Longsleeve',color:'Washed Black',price:5495,category:'Longsleeves',sizes:['S','M','L','XL'],available:true},
  {id:'longsleeve-grey',name:'AMORE Heavyweight Longsleeve',color:'Washed Charcoal',price:5495,category:'Longsleeves',sizes:['S','M','L','XL'],available:true},
  {id:'tee-black',name:'AMORE Essential Tee',color:'Black',price:3495,category:'T-shirts',sizes:['S','M','L','XL'],available:true}
];
app.get('/api/products',(_req,res)=>res.json(products));
const orders = new Map(); // DEMO: voor productie vervangen door een database.
const euro = cents => (cents/100).toFixed(2);
const key = process.env.MOLLIE_API_KEY;
async function mollie(path,opts={}) {
  const response=await fetch(`https://api.mollie.com/v2${path}`,{...opts,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(opts.headers||{})}});
  const data=await response.json();
  if(!response.ok) throw new Error(data.detail||`Mollie HTTP ${response.status}`);
  return data;
}
app.post('/api/checkout',async(req,res)=>{
 try{
  if(!key||!process.env.BASE_URL||!/^https:\/\//.test(process.env.BASE_URL)) return res.status(503).json({error:'Mollie is nog niet ingesteld. Configureer MOLLIE_API_KEY en een openbare HTTPS BASE_URL.'});
  const raw=req.body?.items;
  if(!Array.isArray(raw)||raw.length===0||raw.length>30) return res.status(400).json({error:'Ongeldige winkelwagen.'});
  const items=[];
  for(const item of raw){
   const product=products.find(p=>p.id===item.id && p.available);
   if(!product||!product.sizes.includes(item.size)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10) return res.status(400).json({error:'Ongeldig product, maat of aantal.'});
   items.push({productId:product.id,size:item.size,quantity:item.quantity,unitPrice:product.price});
  }
  const amount=items.reduce((s,i)=>s+i.unitPrice*i.quantity,0);
  if(amount<100) return res.status(400).json({error:'Minimum bedrag €1,00.'});
  const orderId=crypto.randomUUID();
  orders.set(orderId,{status:'pending',items,amount,createdAt:Date.now()});
  const base=process.env.BASE_URL.replace(/\/$/,'');
  const payment=await mollie('/payments',{method:'POST',body:JSON.stringify({amount:{currency:'EUR',value:euro(amount)},description:`AMORE bestelling ${orderId.slice(0,8)}`,redirectUrl:`${base}/?order=${encodeURIComponent(orderId)}`,webhookUrl:`${base}/api/mollie/webhook`,metadata:{orderId}})});
  orders.get(orderId).paymentId=payment.id;
  res.json({checkoutUrl:payment._links.checkout.href,orderId});
 }catch(err){console.error('Checkout error',err.message);res.status(502).json({error:'Betaling kon niet worden gestart. Controleer de serverinstellingen.'});}
});
// Mollie webhooks sturen doorgaans application/x-www-form-urlencoded met het payment-id.
app.post('/api/mollie/webhook',express.urlencoded({extended:false}),async(req,res)=>{
 const paymentId=req.body?.id;
 if(typeof paymentId!=='string'||!/^tr_[A-Za-z0-9]+$/.test(paymentId)) return res.sendStatus(400);
 try{
  const payment=await mollie(`/payments/${encodeURIComponent(paymentId)}`);
  const order=orders.get(payment.metadata?.orderId);
  if(order && order.paymentId===payment.id && payment.amount?.currency==='EUR' && payment.amount.value===euro(order.amount)){
   order.status=payment.status; // Fulfil alleen als payment.status === 'paid'.
   console.log('AMORE order payment:',payment.metadata.orderId,payment.status);
  }
  res.sendStatus(200);
 }catch(err){console.error('Webhook error:',err.message);res.sendStatus(500);}
});
app.get('/api/order/:id',async(req,res)=>{
 const order=orders.get(req.params.id);
 if(!order)return res.status(404).json({error:'Bestelling niet gevonden (of server opnieuw gestart).'});
 // Vraag de status opnieuw op bij Mollie: een redirect is zelf geen betalingsbewijs.
 if(order.paymentId&&key){try{const p=await mollie(`/payments/${encodeURIComponent(order.paymentId)}`);if(p.amount?.value===euro(order.amount))order.status=p.status;}catch{}}
 res.json({status:order.status});
});
app.listen(port,()=>console.log(`AMORE website: http://localhost:${port}`));
