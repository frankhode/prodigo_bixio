'use strict';
const $=s=>document.querySelector(s), el=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
let db,token,active,record,step=0,dirty=false,busy=false,scale=1,editingField=null;
const previewObserver=new IntersectionObserver(items=>{for(const item of items){if(!item.isIntersecting)continue;previewObserver.unobserve(item.target);const img=item.target;BixioMedia.show(img,img.dataset.id,img.parentElement.querySelector(".preview-state"));}},{rootMargin:"150px"});
const defaults={people:['Hombres','Mujeres','Niños','Niñas','Bebés'],objects:['Pelotas','Juguetes','Flores','Libros','Instrumentos musicales','Muebles','Accesorios'],highlights:['Sombrero','Vestimenta','Accesorios','Peinado','Calzado','Joyas']};
const titles=['Identificación','Tipo de imagen','Personas','Objetos','Destacados','Firma del estudio','Revisar'];
async function api(action,data){return GithubStore.mutate(action,data);}
async function load(){let v=await api('state');db=v.db;token=v.token;window.bixioToken=token;render();}
function images(){return Object.values(db.images).filter(i=>(!$('#folder').value||i.folder===$('#folder').value)&&(!$('#status').value||i.status===$('#status').value)&&JSON.stringify([i.relative,i.record]).toLocaleLowerCase().includes($('#search').value.toLocaleLowerCase())).sort((a,b)=>a.relative.localeCompare(b.relative,undefined,{numeric:true}));}
function render(){const selected=$('#folder').value;$('#folder').replaceChildren(new Option('Todas las carpetas',''));for(const[id,f]of Object.entries(db.folders))$('#folder').add(new Option(f.name||f.path||'Carpeta',id));$('#folder').value=selected;const list=images();$('#count').textContent=list.length+' imágenes';previewObserver.disconnect();$('#gallery').replaceChildren();for(const i of list){let b=el('button','');b.className='tile';let img=new Image();img.dataset.id=i.id;img.alt=i.relative;let state=el('span','Preparando imagen…');state.className='preview-state';b.append(img,state,el('strong',i.record.number||i.relative),el('small',({pending:'Pendiente',draft:'Borrador',done:'Catalogada'})[i.status]));b.onclick=()=>open(i);$('#gallery').append(b);previewObserver.observe(img);}window.FieldDashboard?.render();if(!list.length)$('#gallery').append(el('p',Object.keys(db.images).length?'No hay imágenes para estos filtros.':'Agregá una carpeta para empezar.'));}
function recordForEditing(value){return structuredClone(value&&typeof value==='object'?{...value}:{});}
function open(i,focusedField=null){if(!GithubStore.connected){$('#connection-error').textContent='Conectá GitHub para editar fichas.';$('#connection').showModal();$('#github-token').focus();return;}editingField=focusedField;active=i;record=recordForEditing(i.record);step=0;dirty=false;$('#filename').textContent=i.relative;$('#photo').removeAttribute('src');BixioMedia.show($('#photo'),i.id,$('#image-error'),true);scale=1;zoom();show();if(!$('#editor').open)$('#editor').showModal();focusFirst();}
$('#photo').onerror=()=>{$('#photo').hidden=true;$('#image-error').textContent='No se pudo mostrar esta imagen.';$('#image-error').hidden=false;};
function zoom(){$('#photo').style.width=scale*100+'%';$('#photo').style.height=scale===1?'100%':'auto';}
$('#plus').onclick=()=>{scale=Math.min(5,scale+.25);zoom();};$('#minus').onclick=()=>{scale=Math.max(1,scale-.25);zoom();};$('#fit').onclick=()=>{scale=1;zoom();};
function focusFirst(){setTimeout(()=>$('#fields input, #fields select, #fields textarea, #fields button')?.focus(),0);}
function field(label,key,options){const wrap=el('label',label);let input;if(options){input=el('select','');input.add(new Option('Sin indicar',''));for(const v of options)input.add(new Option(v,v));}else input=el(key==='notes'?'textarea':'input','');input.value=record[key]||'';input.oninput=()=>{record[key]=input.value;dirty=true;if(key==='kind')show();};wrap.append(input);$('#fields').append(wrap);return input;}
function tags(key){let selected=record[key]||[];record[key]=selected;let box=el('div','');box.className='choices';for(const term of [...new Set([...(defaults[key]||[]),...(db.terms[key]||[]),...selected])]){let label=el('label',''),input=el('input','');input.type='checkbox';input.checked=selected.includes(term);input.onchange=()=>{record[key]=input.checked?[...record[key],term]:record[key].filter(x=>x!==term);dirty=true;};label.append(input,document.createTextNode(term));box.append(label);}$('#fields').append(box);let row=el('div','');row.className='add-term';let input=el('input','');input.placeholder='Agregar término';input.setAttribute('aria-label','Nuevo término');let add=el('button','Agregar');add.type='button';const append=()=>{let t=input.value.trim();if(t&&!record[key].includes(t)){record[key].push(t);dirty=true;show();}};add.onclick=append;input.onkeydown=e=>{if(e.key==='Enter'&&input.value.trim()){e.preventDefault();e.stopPropagation();append();}};row.append(input,add);$('#fields').append(row);}
function identifierFields(){
 const group=el('fieldset','');group.className='identifier-fields';group.append(el('legend','Identificador único de la pieza'));
 const type=field('Tipo de identificador','identifierType',['Barcode Aleph','Inventario','Otro']);
 const value=field('Barcode / inventario','identifier');value.type='text';value.autocomplete='off';value.placeholder='Conserva los ceros iniciales';
 type.value=record.identifierType||'Otro';value.addEventListener('input',()=>{record.identifierType=type.value||'Otro';});
 const parent=type.parentElement;group.append(parent,value.parentElement);$('#fields').append(group);
}
function authorField(){
 const names=[...new Set([...(db.authors||[]),...Object.values(db.images).map(i=>i.record?.author),record.author].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 const select=field('Autor / fotógrafo','author',names);
 const row=el('div','');row.className='add-term';const input=el('input','');input.placeholder='Agregar un autor';input.setAttribute('aria-label','Nombre del nuevo autor');input.maxLength=300;
 const button=el('button','Agregar autor');button.type='button';
 const add=()=>{const name=input.value.trim().replace(/\s+/g,' ');if(!name)return;db.authors=[...new Set([...(db.authors||[]),name])];record.author=name;dirty=true;show();};
 button.onclick=add;input.onkeydown=e=>{if(e.key==='Enter'&&input.value.trim()){e.preventDefault();e.stopPropagation();add();}};row.append(input,button);$('#fields').append(row);
}
function namesField(){
 const label=el('label','Nombres de las personas identificadas');const input=el('textarea','');input.value=(record.identifiedPeople||[]).join('\n');input.rows=4;input.placeholder='Un nombre por línea';input.oninput=()=>{record.identifiedPeople=[...new Set(input.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean))];dirty=true;};
 label.append(input);$('#fields').append(label);
}
function renderSingleField(key){
 const definition=RecordFields.definitions[key];
 if(definition.type==='identifier')identifierFields();else if(definition.type==='author')authorField();else if(definition.type==='names')namesField();else if(definition.type==='signature')signatureFields();else if(definition.type==='tags')tags(key);else field(definition.label,key,definition.options);
}
function signatureFields(){
 const select=field('Firma del estudio','signature',[]);
 select.id='signature-select';
 for(const [code,name] of Object.entries(db.signatures||{})) select.add(new Option(/^[A-Z]+-\d+$/.test(code)?code+' · '+name:name,code));
 select.value=record.signature||'';
 const detail=el('p','');detail.className='signature-detail';
 function updateDetail(){detail.textContent=(db.signatures||{})[select.value]||'';}
 select.addEventListener('change',updateDetail);updateDetail();$('#fields').append(detail);
 const reveal=el('button','＋ Nueva firma');reveal.type='button';reveal.id='new-signature';reveal.setAttribute('aria-expanded','false');
 const box=el('div','');box.className='signature-new';box.hidden=true;
 const label=el('label','Descripción de la nueva firma');label.htmlFor='signature-name';
 const input=el('input','');input.id='signature-name';input.maxLength=200;input.placeholder='Texto, dirección o características de la firma';
 const error=el('p','');error.setAttribute('role','alert');error.className='signature-error';
 const create=el('button','Agregar y seleccionar');create.type='button';
 const cancel=el('button','Cancelar');cancel.type='button';
 const controls=el('div','');controls.className='signature-actions';controls.append(create,cancel);box.append(label,input,controls,error);
 reveal.onclick=()=>{box.hidden=false;reveal.hidden=true;reveal.setAttribute('aria-expanded','true');input.focus();};
 cancel.onclick=()=>{box.hidden=true;reveal.hidden=false;reveal.setAttribute('aria-expanded','false');reveal.focus();};
 async function add(){
  const targetRecord=record;
  const name=input.value.trim();if(!name){error.textContent='Escribí la descripción de la firma.';input.focus();return;}
  create.disabled=cancel.disabled=true;error.textContent='';
  try{const result=await api('add_signature',{name});db.signatures=result.signatures;targetRecord.signature=result.code;if(record===targetRecord){dirty=true;if(step===5||editingField==='signature'){show();$('#signature-select')?.focus();}}}
  catch(e){error.textContent=e.message;}
  finally{create.disabled=cancel.disabled=false;}
 }
 create.onclick=add;
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(!create.disabled)add();}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!cancel.disabled)cancel.click();}});
 $('#fields').append(reveal,box);
}
function show(){ if(editingField){window.FieldDashboard.drawEditor(editingField);return;}$('#steps').hidden=false;$('#back').disabled=false;$('#draft').textContent='Guardar borrador';$('#save-error').textContent='';$('#steps').replaceChildren();titles.forEach((t,n)=>{const b=el('button',String(n+1));b.title=t;b.type='button';if(n===step)b.setAttribute('aria-current','step');b.onclick=()=>{step=n;show();};$('#steps').append(b);});$('#step-counter').textContent=`PASO ${step+1} DE ${titles.length}`;$('#step-title').textContent=titles[step];$('#fields').replaceChildren();
if(step===0){field('Parte del documento','side',['Frente','Reverso','Tapa','Otros']);identifierFields();field('Número original','number');field('Fecha (admite año, intervalo o aproximación)','date');const select=field('Vincular con otra imagen de la misma pieza (opcional)','parent',[]);for(const i of Object.values(db.images).filter(x=>x.id!==active.id))select.add(new Option((i.record.side||'Sin parte')+' · '+(i.record.number?i.record.number+' · ':'')+i.relative,i.id));select.value=record.parent||'';select.oninput=()=>{record.parent=select.value;dirty=true;show();};const order=field('Orden de visualización (1, 2, 3…)','displayOrder');order.type='number';order.min='1';order.max='9999';order.placeholder='Automático: frente, reverso, tapa, otros';$('#fields').append(el('p','Vinculá las partes entre sí; pueden formar una cadena. La grilla pública muestra solo los frentes completos. El orden menor aparece primero dentro de la ficha.'));const root=id=>{const seen=new Set();while(db.images[id]?.record?.parent&&!seen.has(id)){seen.add(id);id=db.images[id].record.parent;}return id;};const piece=root(record.parent||active.id);const related=Object.values(db.images).filter(i=>i.id===active.id||root(i.id)===piece).sort((a,b)=>(Number(a.record.displayOrder)||9999)-(Number(b.record.displayOrder)||9999)||a.relative.localeCompare(b.relative,'es',{numeric:true}));$('#fields').append(el('p','Imágenes de esta pieza: '+related.map(i=>(i.id===active.id?'Esta imagen':i.relative)+' ('+(i.record.side||'sin parte')+', orden '+(i.record.displayOrder||'automático')+')').join(' · ')));}
if(step===1){authorField();field('Tipo de imagen','kind',['Retrato','Otros']);if(record.kind==='Retrato'){field('Tipo de retrato','portrait',['Individual','Grupal']);field('Encuadre','frame',['Busto','Medio cuerpo','Tres cuartos','Cuerpo entero']);field('Orientación del rostro','direction',['Frente','Perfil','Tres cuartos','Mixta']);}field('Ambiente','environment',['Estudio','Interior','Exterior']);}
if(step>=2&&step<=4){tags(['people','objects','highlights'][step-2]);if(step===2)namesField();}
if(step===5)signatureFields();
if(step===6){const dl=el('dl','');const labels={identifier:'Identificador único',identifierType:'Tipo de identificador',author:'Autor / fotógrafo',identifiedPeople:'Personas identificadas',side:'Parte',number:'Número',date:'Fecha',kind:'Imagen',portrait:'Retrato',frame:'Encuadre',direction:'Orientación',environment:'Ambiente',people:'Personas',objects:'Objetos',highlights:'Destacados',signature:'Firma del estudio'};for(const[k,label]of Object.entries(labels)){let v=k==='signature'?((db.signatures||{})[record[k]]?(/^[A-Z]+-\d+$/.test(record[k]||'')?record[k]+' · ':'')+db.signatures[record[k]]:''):record[k];if(Array.isArray(v))v=v.join(', ');if(v){dl.append(el('dt',label),el('dd',v));}}$('#fields').append(dl);field('Notas','notes');}
$('#back').textContent=step?'← Anterior':'Cancelar';$('#next').textContent=step===titles.length-1?'Guardar y siguiente imagen →':'Siguiente →';focusFirst();}
function close(){if(busy){$('#save-error').textContent='Esperá a que termine el guardado.';return;}if(dirty&&!confirm('¿Cerrar sin guardar los cambios?'))return;$('#editor').close();}
function back(){if(editingField){window.FieldDashboard.previous();return;}if(step){step--;show();}else close();}
function next(){if(editingField){save(true);return;}if(step<titles.length-1){step++;show();}else save(true);}
async function save(complete){if(busy)return;if(editingField){await window.FieldDashboard.save(complete);return;}record=recordForEditing(record);if(!record.side){step=0;show();$('#save-error').textContent='Elegí la parte del documento.';return;}busy=true;$('#next').disabled=$('#draft').disabled=true;try{let v=await api('save',{id:active.id,revision:active.revision||0,record,complete});db.images[active.id]=v.image;for(const k of Object.keys(defaults))db.terms[k]=[...new Set([...(db.terms[k]||[]),...(record[k]||[])])];dirty=false;let list=images(),idx=list.findIndex(x=>x.id===active.id);const following=idx>=0?list.slice(idx+1).concat(list.slice(0,idx)).find(x=>x.status!=='done'):list.find(x=>x.status!=='done');$('#editor').close();render();if(complete&&following)open(following);else $('#notice').textContent=complete?'Registro guardado en GitHub.':'Borrador guardado en GitHub.';}catch(e){$('#save-error').textContent=e.message;}finally{busy=false;$('#next').disabled=$('#draft').disabled=false;}}
$('#fields').onsubmit=e=>e.preventDefault();$('#next').onclick=next;$('#back').onclick=back;$('#close').onclick=close;$('#draft').onclick=()=>save(false);$('#editor').addEventListener('cancel',e=>{e.preventDefault();back();});$('#editor').addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();save(true);}else if(e.key==='Enter'&&!e.target.closest('button')&&e.target.tagName!=='TEXTAREA'){e.preventDefault();next();}});window.onbeforeunload=e=>{if(dirty){e.preventDefault();e.returnValue='';}};
for(const id of ['folder','status','search'])$('#'+id).oninput=render;
$('#resume').onclick=()=>{let i=images().find(i=>i.status!=='done');if(i)open(i);else $('#notice').textContent='No quedan pendientes en esta selección.';};

$('#editor').addEventListener('close',()=>{editingField=null;window.FieldDashboard?.release();});
