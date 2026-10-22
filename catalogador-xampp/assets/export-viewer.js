'use strict';
// JSON portátil: solo fichas completas y sus vistas; sin rutas absolutas.
$('#export-viewer').onclick=async()=>{
 const button=$('#export-viewer');button.disabled=true;
 try{
  const state=await api('state'),snapshot=state.db;
  window.bixioToken=state.token;
  const list=Object.values(snapshot.images).filter(i=>i.status==='done');
  if(!list.length)throw Error('Guardá al menos una ficha como catalogada para exportar.');
  const portable={format:'prodigo-bixio-viewer',version:1,exported:new Date().toISOString(),images:{},signatures:snapshot.signatures||{},previews:{}};
  for(let n=0;n<list.length;n++){
   const image=list[n];$('#notice').textContent=`Preparando imágenes ${n+1} de ${list.length} · ${image.relative}`;
   let url;try{url=await BixioMedia.get(image.id,true);}catch(e){throw Error(image.relative+': '+e.message);}
   const response=await fetch(url);if(!response.ok)throw Error('No se pudo exportar '+image.relative);
   const blob=await response.blob();
   const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('No se pudo incluir '+image.relative));reader.readAsDataURL(blob);});
   portable.images[image.id]={id:image.id,relative:image.relative,status:'done',record:image.record};portable.previews[image.id]=dataUrl;
  }
  const blob=new Blob([JSON.stringify(portable)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='bixio-visor.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('#notice').textContent=`Exportadas ${list.length} imágenes con sus fichas. Abrí bixio-visor.json desde Importar JSON en el visor web.`;
 }catch(e){$('#notice').textContent=e.message;}finally{button.disabled=false;}
};
