'use strict';
// Lectura pública del repositorio del catalogador. No usa tokens.
window.BixioRemote=(()=>{
 const ROOT='https://raw.githubusercontent.com/frankhode/prodigo-catalogador/main/';
 let current='bixio',lastVersion=null,lastUpdated=0,reading=false,registry=null;
 const status=$('import-status'),select=$('live-collection');
 function safeMedia(path){return typeof path==='string'&&/^media\/[a-z0-9-]+\/[a-f0-9]+-[a-f0-9]+(?:-thumb)?\.(webp|jpg)$/.test(path)?ROOT+path:BixioFormat.blank;}
 async function json(path,key){const response=await fetch(ROOT+path+'?v='+encodeURIComponent(key),{cache:'no-store'});if(!response.ok)throw Error('No se pudo actualizar el catálogo online.');return response.json();}
 function options(index){const before=select.value;select.replaceChildren(new Option('Muestra de prueba','demo'));for(const c of index.collections)select.add(new Option(c.name,c.id));select.add(new Option('Vista local','local'));select.value=current||before||'demo';}
 async function update(force=false){
  if(!current||current==='demo'||reading)return;reading=true;const requested=current;
  try{
   registry=await json('data/index.json',Date.now());if(current!==requested)return;options(registry);
   const meta=registry.collections.find(c=>c.id===requested);if(!meta)return;
   if(!force&&meta.version===lastVersion)return;if(Date.parse(meta.updated||'')<lastUpdated)return;
   if(!/^data\/collections\/[a-z0-9-]+\.json$/.test(meta.path))throw Error('Ruta de colección inválida.');
   const source=await json(meta.path,meta.version);if(current!==requested)return;if(source.version!==meta.version)throw Error('GitHub está propagando el último guardado.');
   const ready=Object.fromEntries(Object.entries(source.images).filter(([,image])=>image.status==='done'&&image.media?.src&&image.media?.thumb));
   const result=Object.keys(ready).length?BixioFormat.convert({...source,images:ready}):{items:[],facets:{}};
   for(const item of result.items){const image=ready[item.id];item.src=safeMedia(image.media.src);item.thumb=safeMedia(image.media.thumb);item.w=image.media.w;item.h=image.media.h;delete item.imageKey;delete item.backKey;
    if(item.back){item.backSrc=safeMedia(ready[item.back]?.media?.src);}
   }
   const wasOpen=!viewer.hidden,previous=wasOpen?shown[activeIndex]?.id:null;
   window.BixioImport?.deactivate();sourceVersion++;installCatalog(result.items,result.facets);
   if(previous){const index=shown.findIndex(i=>i.id===previous);if(index>=0)openViewer(index);else closeViewer();}
   $('collection-name-display').textContent=meta.name;lastVersion=meta.version;lastUpdated=Date.parse(meta.updated||'')||0;
   status.textContent=result.items.length?`${meta.name} · ${result.items.length} fichas · actualización automática cada 30 s`:`${meta.name} · todavía no hay fichas completas con imágenes publicadas.`;
  }catch(e){status.textContent=e.message+' Se conserva la vista anterior.';}finally{reading=false;if(current&&current!=='demo'&&current!==requested)queueMicrotask(()=>update(true));}
 }
 function stop(){current=null;lastVersion=null;select.value='local';}
 select.add(new Option('Vista local','local'));
 select.onchange=()=>{if(select.value==='demo'){current='demo';location.href=location.pathname+'?demo=1';return;}if(select.value==='local')return;current=select.value;lastVersion=null;lastUpdated=0;update(true);};
 $('sync-now').onclick=()=>{if(current&&current!=='demo')update(true);};
 const params=new URLSearchParams(location.search);
 if(params.get('demo')==='1'){current='demo';json('data/index.json',Date.now()).then(options).catch(()=>{});}
 else{current=params.get('coleccion')||'bixio';update(true);}
 setInterval(()=>{if(!document.hidden)update();},30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
 return {stop,update};
})();
