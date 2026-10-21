'use strict';
window.BixioMedia=(()=>{
  const entries=new Map();let tasks=[],running=false;
  function enqueue(run,priority,id){return new Promise((resolve,reject)=>{const task={run,resolve,reject,id};priority?tasks.unshift(task):tasks.push(task);drain();});}
  async function drain(){if(running)return;running=true;while(tasks.length){const task=tasks.shift();try{task.resolve(await task.run());}catch(e){task.reject(e);}}running=false;}
  function decode(buffer){return new Promise((resolve,reject)=>{
    const worker=new Worker('assets/tiff-worker.js?v=2');
    const timer=setTimeout(()=>{worker.terminate();reject(Error('Este TIFF tardó demasiado en procesarse.'));},120000);
    const finish=()=>{clearTimeout(timer);worker.terminate();};
    worker.onerror=()=>{finish();reject(Error('No se pudo iniciar el decodificador TIFF. Revisá que se haya copiado la carpeta assets completa.'));};
    worker.onmessage=e=>{finish();e.data.error?reject(Error(e.data.error)):resolve(e.data);};
    worker.postMessage(buffer,[buffer]);
  });}
  async function jpeg(buffer){
    const {width,height,rgba}=await decode(buffer);
    const source=document.createElement('canvas');source.width=width;source.height=height;
    const ctx=source.getContext('2d');const pixels=ctx.createImageData(width,height);pixels.data.set(rgba);ctx.putImageData(pixels,0,0);
    const scale=Math.min(1,2400/Math.max(width,height));const out=document.createElement('canvas');out.width=Math.max(1,Math.round(width*scale));out.height=Math.max(1,Math.round(height*scale));out.getContext('2d').drawImage(source,0,0,out.width,out.height);source.width=source.height=1;
    return new Promise((resolve,reject)=>out.toBlob(blob=>{out.width=out.height=1;blob?resolve(blob):reject(Error('No se pudo preparar la vista.'));},'image/jpeg',.9));
  }
  function asBase64(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('No se pudo guardar la vista.'));reader.readAsDataURL(blob);});}
  async function read(id){
    const response=await fetch('api.php?action=image&id='+encodeURIComponent(id));
    if(!response.ok){let message='No se puede leer la imagen.';try{message=(await response.json()).error||message;}catch{}throw Error(message);}
    let blob;
    if((response.headers.get('Content-Type')||'').includes('image/tiff')){
      blob=await jpeg(await response.arrayBuffer());
      // Si el cache falla, la imagen sigue disponible durante esta sesión.
      try{const saved=await fetch('api.php?action=preview',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':window.bixioToken},body:JSON.stringify({id,version:response.headers.get('X-Image-Version'),jpeg:await asBase64(blob)})});if(!saved.ok)throw Error('No se pudo guardar la vista en datos/vistas.');}catch(e){console.warn(e);}
    }else blob=await response.blob();
    return URL.createObjectURL(blob);
  }
  function get(id,priority=false){if(!entries.has(id)){const promise=enqueue(()=>read(id),priority,id).catch(e=>{entries.delete(id);throw e;});entries.set(id,promise);}else if(priority){const index=tasks.findIndex(task=>task.id===id);if(index>0)tasks.unshift(tasks.splice(index,1)[0]);}return entries.get(id);}
  async function show(img,id,status,priority=false){
    img.dataset.imageId=id;img.hidden=true;status.hidden=false;status.textContent='Preparando imagen…';
    try{const url=await get(id,priority);if(img.dataset.imageId!==id||!img.isConnected)return;img.src=url;img.hidden=false;status.hidden=true;}
    catch(e){if(img.dataset.imageId!==id||!img.isConnected)return;status.textContent=e.message;status.hidden=false;}
  }
  return {show};
})();
