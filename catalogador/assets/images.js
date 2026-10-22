'use strict';
const OnlineImages=(()=>{
 function decode(buffer){return new Promise((resolve,reject)=>{
  const worker=new Worker('assets/tiff-worker.js'),timer=setTimeout(()=>{worker.terminate();reject(Error('El TIFF tardó demasiado.'));},120000);
  const finish=()=>{clearTimeout(timer);worker.terminate();};worker.onerror=()=>{finish();reject(Error('No se pudo iniciar el decodificador TIFF.'));};worker.onmessage=e=>{finish();e.data.error?reject(Error(e.data.error)):resolve(e.data);};worker.postMessage(buffer,[buffer]);
 });}
 async function encode(canvas,max,quality){const scale=Math.min(1,max/Math.max(canvas.width,canvas.height)),out=document.createElement('canvas');out.width=Math.max(1,Math.round(canvas.width*scale));out.height=Math.max(1,Math.round(canvas.height*scale));out.getContext('2d').drawImage(canvas,0,0,out.width,out.height);let blob=await new Promise(resolve=>out.toBlob(resolve,'image/webp',quality));if(blob&&blob.type!=='image/webp')blob=await new Promise(resolve=>out.toBlob(resolve,'image/jpeg',quality));if(!blob)throw Error('No se pudo generar la imagen.');const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(blob);});const result={base64,ext:blob.type==='image/webp'?'webp':'jpg',width:out.width,height:out.height};out.width=out.height=1;return result;}
 async function prepare(file){
  const canvas=document.createElement('canvas');
  try{
   if(/\.tiff?$/i.test(file.name)){const {width,height,rgba}=await decode(await file.arrayBuffer());canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(width,height);pixels.data.set(rgba);ctx.putImageData(pixels,0,0);}
   else{const bitmap=await createImageBitmap(file);canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);bitmap.close();}
   return {thumb:await encode(canvas,360,.78),full:await encode(canvas,2200,.86)};
  }finally{canvas.width=canvas.height=1;}
 }
 async function hash(text){const bytes=new TextEncoder().encode(text),digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
 function show(img,id,status){const image=GithubStore.image(id);if(!image?.media){img.hidden=true;status.hidden=false;status.textContent='Vista no disponible';return;}img.hidden=false;status.hidden=true;img.src=GithubStore.url(img.id==='photo'?image.media.src:image.media.thumb);img.onerror=()=>{img.hidden=true;status.hidden=false;status.textContent='No se pudo cargar la vista. Probá recargar en unos segundos.';};}
 return {prepare,hash,show};
})();
const BixioMedia=OnlineImages;
