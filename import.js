'use strict';
window.BixioImport=(()=>{
 let catalog=null,filesById=new Map(),urls=new Map(),pending=new Map(),queue=Promise.resolve();
 const note=$('import-status');
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);const item=shown[Number(e.target.closest('[data-i]').dataset.i)];if(item?.imageKey)paint(e.target,item.imageKey);}},{rootMargin:'200px'});
 function path(s){return String(s).replace(/\\/g,'/').replace(/^\/+|\/+$/g,'');}
 function embedded(id){const value=catalog?.source.previews?.[id];return typeof value==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)?value:null;}
 function convertTiff(file){return new Promise((resolve,reject)=>{
  const worker=new Worker('catalogador-xampp/assets/tiff-worker.js?v=2');let timer=setTimeout(()=>{worker.terminate();reject(Error('Este TIFF tardó demasiado.'));},120000);
  const finish=()=>{clearTimeout(timer);worker.terminate();};
  worker.onerror=()=>{finish();reject(Error('No se pudo leer el TIFF.'));};
  worker.onmessage=event=>{finish();if(event.data.error){reject(Error(event.data.error));return;}try{const {width,height,rgba}=event.data,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(width,height);pixels.data.set(rgba);ctx.putImageData(pixels,0,0);const output=document.createElement('canvas'),scale=Math.min(1,2400/Math.max(width,height));output.width=Math.max(1,Math.round(width*scale));output.height=Math.max(1,Math.round(height*scale));output.getContext('2d').drawImage(canvas,0,0,output.width,output.height);canvas.width=canvas.height=1;output.toBlob(blob=>{output.width=output.height=1;blob?resolve(URL.createObjectURL(blob)):reject(Error('No se pudo generar la vista.'));},'image/jpeg',.9);}catch(e){reject(e);}};
  file.arrayBuffer().then(buffer=>worker.postMessage(buffer,[buffer])).catch(e=>{finish();reject(e);});
 });}
 async function resolve(id){if(urls.has(id))return urls.get(id);const direct=embedded(id);if(direct)return direct;if(pending.has(id))return pending.get(id);const file=filesById.get(id);if(!file)return BixioFormat.blank;
 const task=queue.then(()=>/\.tiff?$/i.test(file.name)?convertTiff(file):URL.createObjectURL(file));queue=task.catch(()=>{});pending.set(id,task);try{const url=await task;urls.set(id,url);return url;}finally{pending.delete(id);}}
 async function paint(img,id){const revision=sourceVersion;img.dataset.localImage=id;try{const url=await resolve(id);if(revision!==sourceVersion||img.dataset.localImage!==id)return;img.src=url;}catch(e){note.textContent=e.message;}}
 function bindGallery(){observer.disconnect();if(catalog)gallery.querySelectorAll('img').forEach(img=>observer.observe(img));}
 function clearUrls(){for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();filesById.clear();pending.clear();}
 $('import-json').onclick=()=>$('json-picker').click();
 $('json-picker').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const next=BixioFormat.convert(JSON.parse(await file.text()));closeViewer();window.BixioRemote?.stop();sourceVersion++;clearUrls();catalog=next;installCatalog(next.items,next.facets);$('link-images').hidden=false;$('restore-demo').hidden=false;note.textContent=`${next.items.length} fichas catalogadas importadas. `+(next.source.previews?'Las imágenes están incluidas.':'Elegí Vincular imágenes y seleccioná la carpeta de los TIF o JPG.');}catch(error){note.textContent=error.message;}finally{e.target.value='';}};
 $('link-images').onclick=()=>$('image-picker').click();
 $('image-picker').onchange=e=>{
 if(!catalog)return;const files=[...e.target.files].filter(f=>/\.(tiff?|jpe?g|png|webp)$/i.test(f.name)),byName=new Map();
 for(const f of files){const full=path(f.webkitRelativePath||f.name);const name=f.name.toLowerCase();if(!byName.has(name))byName.set(name,[]);byName.get(name).push(f);}
 const matches=new Map();let ambiguous=0;
 for(const [id,image]of catalog.images){const relative=path(image.relative),folder=catalog.source.folders?.[image.folder],rootName=folder?.name||path(folder?.path||'').split('/').at(-1)||'';
 let candidates=files.filter(f=>{const full=path(f.webkitRelativePath||f.name);return full===relative||full===rootName+'/'+relative;});
 if(candidates.length!==1){const possible=files.filter(f=>path(f.webkitRelativePath||f.name).endsWith('/'+relative));candidates=possible.length?possible:(byName.get(relative.split('/').at(-1).toLowerCase())||[]);}
 if(candidates.length===1)matches.set(id,candidates[0]);else if(candidates.length>1)ambiguous++;
 }
 sourceVersion++;clearUrls();filesById=matches;render();if(!viewer.hidden)showPhoto();note.textContent=`${matches.size} imágenes vinculadas de ${catalog.images.size}.`+(ambiguous?` ${ambiguous} nombres repetidos: seleccioná la carpeta específica para evitar confundirlos.`:'');e.target.value='';
 };
 $('restore-demo').onclick=()=>location.reload();
 return {paint,bindGallery,deactivate(){catalog=null;clearUrls();observer.disconnect();}};
})();
