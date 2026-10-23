'use strict';
// Definiciones compartidas por la ficha y el panel de revisión por campos.
const RecordFields=(()=>{
 const definitions={
  identifier:{label:'Identificador único',type:'identifier'},author:{label:'Autor / fotógrafo',type:'author'},identifiedPeople:{label:'Personas identificadas',type:'names'},
  displayOrder:{label:'Orden de visualización'},side:{label:'Parte del documento',options:['Frente','Reverso','Tapa','Otros']},number:{label:'Número original'},date:{label:'Fecha'},
  kind:{label:'Tipo de imagen',options:['Retrato','Otros']},portrait:{label:'Tipo de retrato',options:['Individual','Grupal'],portraitOnly:true},
  frame:{label:'Encuadre',options:['Busto','Medio cuerpo','Tres cuartos','Cuerpo entero'],portraitOnly:true},direction:{label:'Orientación',options:['Frente','Perfil','Tres cuartos','Mixta'],portraitOnly:true},
  environment:{label:'Ambiente',options:['Estudio','Interior','Exterior']},people:{label:'Personas: categorías',type:'tags'},objects:{label:'Objetos',type:'tags'},highlights:{label:'Destacados',type:'tags'},signature:{label:'Firma del estudio',type:'signature'},notes:{label:'Notas'}
 };
 const has=value=>Array.isArray(value)?value.some(v=>String(v).trim()):value!==undefined&&value!==null&&String(value).trim()!=='';
 const value=(image,key)=>image.record?.[key];
 const applicable=(image,key)=>!definitions[key]?.portraitOnly||image.record?.kind==='Retrato';
 function text(image,key,db){const v=value(image,key);if(!has(v))return 'Sin dato';if(key==='signature')return db.signatures?.[v]||v;return Array.isArray(v)?v.join(' · '):String(v);}
 function stats(images,key){const list=images.filter(i=>applicable(i,key));return {total:list.length,filled:list.filter(i=>has(value(i,key))).length,reviewed:list.filter(i=>i.fieldReviews?.[key]).length};}
 function candidates(images,key,scope){return images.filter(i=>applicable(i,key)&&(scope==='all'||scope==='filled'&&has(value(i,key))||scope==='unreviewed'&&!i.fieldReviews?.[key]||scope==='missing'&&!has(value(i,key))&&!i.fieldReviews?.[key]));}
 function cleanNames(value){if(!Array.isArray(value))throw Error('Indicá un nombre por línea.');if(value.length>100)throw Error('Hay demasiados nombres en esta imagen.');return [...new Set(value.map(v=>{if(typeof v!=='string'||v.length>300)throw Error('Nombre de persona inválido.');return v.trim();}).filter(Boolean))];}
 function normalize(record){
  const next={...record};
  for(const key of ['identifier','author'])if(key in next){if(typeof next[key]!=='string'||next[key].length>300)throw Error('Valor inválido para '+definitions[key]?.label+'.');next[key]=next[key].trim();}
  if('displayOrder' in next){if(next.displayOrder==='')next.displayOrder='';else {const n=Number(next.displayOrder);if(!Number.isInteger(n)||n<1||n>9999)throw Error('El orden debe ser un número entre 1 y 9999.');next.displayOrder=n;}}
  if('identifiedPeople'in next)next.identifiedPeople=cleanNames(next.identifiedPeople);
  return next;
 }
 function validateIdentifier(db,id,record){
  const images={...db.images,[id]:{...db.images[id],record}};
  const root=start=>{let current=start;const seen=new Set();while(images[current]?.record?.parent){if(seen.has(current))throw Error('El vínculo forma un ciclo. Elegí otra imagen o dejá la pieza sin vínculo.');seen.add(current);current=images[current].record.parent;}return current;};
  const ownRoot=root(id);if(!record.identifier)return;const key=record.identifier.toLocaleUpperCase();
  for(const other of Object.values(images))if(other.id!==id&&String(other.record?.identifier||'').trim().toLocaleUpperCase()===key&&root(other.id)!==ownRoot)throw Error('El identificador '+record.identifier+' ya pertenece a '+(other.record.number||other.relative)+'. Solo los archivos de una misma pieza vinculada pueden compartirlo.');
 }
 return {definitions,has,value,applicable,text,stats,candidates,cleanNames,normalize,validateIdentifier};
})();
if(typeof module!=='undefined')module.exports=RecordFields;
