'use strict';
window.FieldDashboard=(()=>{
 let session=null;
 const selector=$('#review-field'),scope=$('#review-scope');
 for(const [key,definition]of Object.entries(RecordFields.definitions))selector.add(new Option(definition.label,key));selector.value='author';
 const items=()=>db?RecordFields.candidates(images(),selector.value,scope.value):[];
 function render(){
  if(!db)return;const selection=images();$('#dashboard-summary').textContent=`${selection.length} imágenes en la selección actual`;
  const cards=$('#field-stats');cards.replaceChildren();for(const key of ['author','identifiedPeople','identifier']){const count=RecordFields.stats(selection,key),button=el('button','');button.type='button';button.className='field-stat';button.append(el('strong',RecordFields.definitions[key].label),el('span',`${count.filled} / ${count.total} con dato`),el('small',`${count.total-count.filled} vacíos · ${count.reviewed} revisados`));button.onclick=()=>{selector.value=key;$('#dashboard-panel').open=true;render();};cards.append(button);}
  const list=items();$('#review-count').textContent=`${list.length} imágenes para ${RecordFields.definitions[selector.value].label.toLowerCase()}`;$('#review-list').replaceChildren();
  for(const image of list.slice(0,50)){const row=el('button','');row.type='button';row.className='review-row';if(image.media?.thumb){const thumb=new Image();thumb.src=GithubStore.url(image.media.thumb);thumb.alt='';thumb.loading='lazy';row.append(thumb);}const text=el('span','');text.append(el('strong',image.record.identifier||image.record.number||image.relative),el('span',RecordFields.text(image,selector.value,db)),el('small',image.fieldReviews?.[selector.value]?'Revisado':'Sin revisar'));row.append(text);row.onclick=()=>start(image.id);$('#review-list').append(row);}
  if(list.length>50)$('#review-list').append(el('p','Se muestran las primeras 50. El recorrido incluye todas las imágenes de esta selección.'));
  if(!list.length)$('#review-list').append(el('p','No hay imágenes para este campo y filtro.'));
 }
 function start(id){
  if(typeof guarded==='function'&&!guarded())return;
  if(!GithubStore.connected){$('#connection-error').textContent='Conectá GitHub para completar o revisar campos.';$('#connection').showModal();return;}
  const list=items();if(!list.length)return;
  session={field:selector.value,ids:list.map(i=>i.id),cursor:Math.max(0,list.findIndex(i=>i.id===id)),saved:0};openCurrent();
 }
 function openCurrent(){if(!session)return;const image=db.images[session.ids[session.cursor]];if(image)open(image,session.field);}
 function drawEditor(key){
  $('#steps').hidden=true;$('#step-counter').textContent=`REVISIÓN POR CAMPO · ${session.cursor+1} / ${session.ids.length}`;$('#step-title').textContent=RecordFields.definitions[key].label;$('#fields').replaceChildren();$('#save-error').textContent='';renderSingleField(key);
  $('#fields').append(el('p','Este guardado modifica solo el campo elegido y conserva el estado de catalogación. Podés dejarlo vacío si no hay datos y marcarlo como revisado.'));
  $('#back').textContent='← Imagen anterior';$('#back').disabled=session.cursor===0;$('#draft').textContent='Guardar y cerrar';$('#next').textContent='Guardar y siguiente imagen →';
  let skip=$('#skip-field');if(!skip){skip=el('button','Saltar imagen →');skip.id='skip-field';skip.type='button';$('#next').parentElement.append(skip);skip.onclick=()=>move(1);}skip.hidden=false;focusFirst();
 }
 function move(delta){
  if(busy||!session)return;if(dirty&&!confirm('¿Saltar esta imagen y descartar el cambio sin guardar?'))return;
  const index=session.cursor+delta;if(index>=0&&index<session.ids.length){session.cursor=index;openCurrent();}else finish();
 }
 function finish(){const count=session?.saved||0;dirty=false;$('#editor').close();release();render();$('#notice').textContent=`Recorrido finalizado: ${count} guardados del campo seleccionado.`;}
 async function saveField(advance){
  if(!session||busy)return;busy=true;for(const id of ['next','draft','back','skip-field'])if($('#'+id))$('#'+id).disabled=true;
  const key=session.field;
  try{
   const result=await api('patch_field',{id:active.id,revision:active.revision||0,field:key,value:record[key]??(['names','tags'].includes(RecordFields.definitions[key].type)?[]:''),...(key==='identifier'?{identifierType:record.identifierType||'Otro'}:{})});
   db.images[active.id]=result.image;db.authors=result.authors;
   if(RecordFields.definitions[key].type==='tags')db.terms[key]=[...new Set([...(db.terms[key]||[]),...(result.image.record[key]||[])])];
   session.saved++;dirty=false;active=result.image;record=recordForEditing(active.record);render();
   if(advance&&session.cursor+1<session.ids.length){session.cursor++;openCurrent();}else if(advance)finish();else{$('#editor').close();release();$('#notice').textContent='Campo guardado y marcado como revisado.';}
  }catch(e){$('#save-error').textContent=e.message;}
  finally{busy=false;for(const id of ['next','draft','back','skip-field'])if($('#'+id))$('#'+id).disabled=false;if(session)$('#back').disabled=session.cursor===0;}
 }
 function release(){session=null;editingField=null;if($('#skip-field'))$('#skip-field').hidden=true;}
 selector.onchange=render;scope.onchange=render;$('#start-review').onclick=()=>start();
 return {render,drawEditor,save:saveField,previous:()=>move(-1),release};
})();
