'use strict';
// El token permanece exclusivamente en memoria y se envía solo a api.github.com.
const GithubStore=(()=>{
 const REPO='frankhode/prodigo-catalogador',API='https://api.github.com/repos/'+REPO,RAW='https://raw.githubusercontent.com/'+REPO+'/main/';
 let token='',version=null,collectionId='bixio',collectionName='Bixio',current=null,registry=null,writing=false;
 const clone=v=>structuredClone(v),encode=s=>btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));
 async function request(path,{method='GET',body}={}){
  if(path!==''&&!path.startsWith('/'))throw Error('Ruta de GitHub inválida.');
  const headers={'Content-Type':'application/json',Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};if(token)headers.Authorization='Bearer '+token;
  let response;
  try{response=await fetch(API+path,{method,headers,cache:'no-store',...(body?{body:JSON.stringify(body)}:{})});}catch(e){throw Error('No se pudo conectar con GitHub. Tus cambios siguen en pantalla.');}
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const e=Error(response.status===401?'La autorización de GitHub no es válida.':response.status===403?'GitHub rechazó la operación: revisá Contents → Read and write y el límite de peticiones.':response.status===409||response.status===422?'El repositorio cambió mientras guardabas. Recargá la colección antes de volver a guardar.':data.message||'No se pudo completar la operación en GitHub.');e.status=response.status;throw e;}
  return data;
 }
 async function head(){const r=await request('/git/ref/heads/main');const commit=await request('/git/commits/'+r.object.sha);return {sha:r.object.sha,tree:commit.tree.sha};}
 async function jsonAt(path,ref){const result=await request('/contents/'+path+'?ref='+ref);if(!result.content)throw Error('El JSON supera el tamaño de lectura permitido por GitHub.');const bytes=Uint8Array.from(atob(result.content.replace(/\s/g,'')),c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes));}
 async function publicJson(path){const r=await fetch(RAW+path+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('No se pudo leer el catálogo público.');return r.json();}
 async function list(){registry=token?await jsonAt('data/index.json',(await head()).sha):await publicJson('data/index.json');return registry;}
 async function open(id){if(writing)throw Error('Esperá a que termine el guardado.');const h=token?await head():null;registry=h?await jsonAt('data/index.json',h.sha):await publicJson('data/index.json');const meta=registry.collections.find(c=>c.id===id);if(!meta)throw Error('Colección inexistente.');const db=h?await jsonAt(meta.path,h.sha):await publicJson(meta.path);collectionId=id;collectionName=meta.name;current=db;version=db.version;return clone(db);}
 async function connect(secret){token=secret.trim();try{const repo=await request('');if(repo.permissions&&repo.permissions.push===false)throw Error('Esta autorización no permite escribir en el repositorio.');await head();return true;}catch(e){token='';throw e;}}
 function disconnect(){token='';}
 function requireAuth(){if(!token)throw Error('Conectá GitHub para guardar en el repositorio.');}
 async function commit(db,extra=[],newCollection=false){
  requireAuth();if(writing)throw Error('Hay otra operación de guardado en curso.');writing=true;
  try{
   const h=await head(),remote=await jsonAt('data/index.json',h.sha),meta=remote.collections.find(c=>c.id===collectionId);
   if(newCollection&&meta)throw Error('Ya existe una colección con ese identificador.');
   if(!newCollection&&(!meta||meta.version!==version))throw Error('La colección fue modificada desde otra ventana. Exportá tu respaldo y recargá antes de guardar.');
   const next=clone(db),nextVersion=crypto.randomUUID();next.version=nextVersion;next.updated=new Date().toISOString();
   const nextMeta={id:collectionId,name:collectionName,path:'data/collections/'+collectionId+'.json',version:nextVersion,updated:next.updated,total:Object.keys(next.images).length,done:Object.values(next.images).filter(i=>i.status==='done').length};
   const updated={...remote,updated:next.updated,collections:[...remote.collections.filter(c=>c.id!==collectionId),nextMeta]};
   const tree=await request('/git/trees',{method:'POST',body:{base_tree:h.tree,tree:[...extra,{path:nextMeta.path,mode:'100644',type:'blob',content:JSON.stringify(next,null,2)},{path:'data/index.json',mode:'100644',type:'blob',content:JSON.stringify(updated,null,2)}]}});
   const c=await request('/git/commits',{method:'POST',body:{message:'Catalogar '+collectionName,tree:tree.sha,parents:[h.sha]}});
   // force:false evita pisar commits ajenos si la rama cambió entre lectura y escritura.
   await request('/git/refs/heads/main',{method:'PATCH',body:{sha:c.sha,force:false}});
   current=next;version=nextVersion;registry=updated;return clone(next);
  }finally{writing=false;}
 }
 async function create(name){
  requireAuth();const id=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);if(!id)throw Error('Escribí un nombre de colección válido.');
  const old={id:collectionId,name:collectionName,current,version};collectionId=id;collectionName=name;
  try{const signatures={none:'Sin firma',unidentified:'Por identificar'};return await commit({format:'prodigo-online',id,name,version:null,folders:{},images:{},terms:{},signatures},[],true);}catch(e){collectionId=old.id;collectionName=old.name;current=old.current;version=old.version;throw e;}
 }
 async function blob(base64){requireAuth();const b=await request('/git/blobs',{method:'POST',body:{content:base64,encoding:'base64'}});return b.sha;}
 async function imageEntries(image,thumb,full){const base='media/'+collectionId+'/'+image.id+'-'+image.fingerprint;const thumbSha=await blob(thumb.base64),fullSha=await blob(full.base64);image.media={thumb:base+'-thumb.'+thumb.ext,src:base+'.'+full.ext,w:full.width,h:full.height};return [{path:image.media.thumb,mode:'100644',type:'blob',sha:thumbSha},{path:image.media.src,mode:'100644',type:'blob',sha:fullSha}];}
 function url(path){if(!/^media\/[a-z0-9-]+\/[a-f0-9]+-[a-f0-9]+(?:-thumb)?\.(webp|jpg)$/.test(path))throw Error('Ruta de imagen inválida.');return RAW+path;}
 async function mutate(action,input){
  if(action==='state')return {db:clone(current),token:''};
  requireAuth();const next=clone(current);
  if(action==='save'){
   const image=next.images[input.id];if(!image)throw Error('Imagen inexistente.');if((image.revision||0)!==input.revision)throw Error('El registro cambió. Recargá la colección.');
   const record=clone({...input.record});if(!['Frente','Reverso','Tapa','Otros'].includes(record.side))throw Error('Elegí la parte del documento.');
   if(record.parent&&(record.parent===image.id||!next.images[record.parent]))throw Error('Vínculo de frente inválido.');
   if(record.signature&&!next.signatures[record.signature])throw Error('La firma ya no está disponible.');
   if(record.kind!=='Retrato')for(const key of ['portrait','frame','direction'])record[key]='';
   image.record=record;image.status=input.complete?'done':'draft';image.revision=(image.revision||0)+1;image.updated=new Date().toISOString();
   for(const key of ['people','objects','highlights'])next.terms[key]=[...new Set([...(next.terms[key]||[]),...(record[key]||[])])];
   await commit(next);return {image:clone(current.images[input.id])};
  }
  if(action==='add_signature'){
   const name=input.name.trim().replace(/\s+/g,' ');if(!name||name.length>200)throw Error('Escribí una firma de hasta 200 caracteres.');
   let code=Object.keys(next.signatures).find(k=>next.signatures[k].toLocaleLowerCase()===name.toLocaleLowerCase());
   if(!code){const prefix=collectionId==='bixio'?'BIX':'FIR',pattern=new RegExp('^'+prefix+'-(\\d+)$'),max=Math.max(0,...Object.keys(next.signatures).map(k=>Number(k.match(pattern)?.[1]||0)));code=prefix+'-'+String(max+1).padStart(2,'0');next.signatures[code]=name;await commit(next);}
   return {code,signatures:clone(current.signatures)};
  }
  throw Error('Operación desconocida.');
 }
 return {REPO,RAW,list,open,connect,disconnect,create,commit,imageEntries,url,mutate,requireAuth,get db(){return clone(current);},get id(){return collectionId;},get connected(){return !!token;},image(id){return clone(current?.images[id]||null);}};
})();
