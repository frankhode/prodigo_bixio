'use strict';
// Adaptación del respaldo XAMPP y del JSON portátil al catálogo del visor.
const BixioFormat=(()=>{
 const blank='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="650"><rect width="500" height="650" fill="#dfd4c6"/><text x="250" y="325" text-anchor="middle" fill="#705540" font-size="20">Vinculá la carpeta de imágenes</text></svg>');
 const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
 function convert(source){
  if(!source||typeof source!=='object'||!source.images||Array.isArray(source.images))throw Error('Elegí el JSON exportado desde el catalogador de Bixio.');
  const all=Object.entries(source.images).map(([id,i])=>({...i,id,record:i.record&&!Array.isArray(i.record)?i.record:{}}));
  const included=all.filter(i=>i.status==='done');
  if(!included.length)throw Error('Este archivo todavía no contiene imágenes catalogadas. Guardá al menos una ficha como completa.');
  const ids=new Set(included.map(i=>i.id)),facets={personas:[],composicion:[],ambiente:[],detalles:[],marca:[],autores:[],identificados:[]};
  const add=(group,key,text)=>{if(!facets[group].some(x=>x[0]===key))facets[group].push([key,text]);return key;};
  const byId=new Map(included.map(i=>[i.id,i]));
  const reverseByParent=new Map();for(const i of included)if(i.record.side==='Reverso'&&ids.has(i.record.parent)&&!reverseByParent.has(i.record.parent))reverseByParent.set(i.record.parent,i);
  const items=included.filter(i=>!(i.record.side==='Reverso'&&reverseByParent.get(i.record.parent)?.id===i.id)).map(i=>{
   const r=i.record,tags=[],brands=[];
   const mark=rec=>{if(rec.signature){let key=rec.signature==='none'?'sin-marca':rec.signature==='unidentified'?'por-identificar':rec.signature;add('marca',key,(key.startsWith('BIX-')?key+' · ':'')+(source.signatures?.[rec.signature]||rec.signature));brands.push(key);}};
   for(const term of r.people||[])tags.push(add('personas','person-'+slug(term),term));
   for(const key of ['kind','portrait','frame','direction'])if(r[key])tags.push(add('composicion',key+'-'+slug(r[key]),r[key]));
   if(r.environment)tags.push(add('ambiente','env-'+slug(r.environment),r.environment));
   for(const key of ['objects','highlights'])for(const term of r[key]||[])tags.push(add('detalles',key+'-'+slug(term),term));
   const reverse=reverseByParent.get(i.id);
   mark(r);if(reverse)mark(reverse.record);
   for(const term of [r.author,reverse?.record?.author].filter(Boolean))tags.push(add('autores','author-'+slug(term),term));
   for(const term of r.identifiedPeople||[])tags.push(add('identificados','name-'+slug(term),term));
   const years=(r.date||'').match(/\b\d{4}\b/g)?.map(Number)||[];
   return {id:i.id,displayId:r.identifier||r.number||i.relative,tags,brand:[...new Set(brands)],year:years[0]??null,yearTo:years[1]??years[0]??null,dateText:r.date||'Sin fecha',w:500,h:650,thumb:blank,src:blank,back:reverse?.id||null,backSrc:reverse?blank:null,record:r,backRecord:reverse?.record||null,imageKey:i.id,backKey:reverse?.id||null};
  });
  for(const values of Object.values(facets))values.sort((a,b)=>a[1].localeCompare(b[1],'es',{numeric:true}));
  return {items,facets,images:byId,source,blank};
 }
 return {convert,blank};
})();
if(typeof module!=='undefined')module.exports=BixioFormat;
