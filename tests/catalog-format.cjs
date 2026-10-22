const assert=require('node:assert/strict');
const {convert}=require('../catalog-format.js');
const db={signatures:{'BIX-14':'Firma nueva'},images:{
 front:{relative:'sub/img024.tif',status:'done',record:{side:'Frente',number:'42',date:'ca. 1945–1950',kind:'Retrato',portrait:'Individual',people:['Niños'],objects:['Triciclo']}},
 reverse:{relative:'sub/img025.tif',status:'done',record:{side:'Reverso',parent:'front',signature:'BIX-14'}},
 extra:{relative:'sub/img026.tif',status:'done',record:{side:'Reverso',parent:'front'}},
 other:{relative:'sinfecha.tif',status:'done',record:{side:'Otros',date:''}},
 pending:{relative:'pendiente.tif',status:'pending',record:[]},draft:{relative:'draft.tif',status:'draft',record:{side:'Frente'}}}};
const r=convert(db);assert.equal(r.items.length,3);const front=r.items[0];assert.equal(front.back,'reverse');assert.equal(front.backKey,'reverse');assert.equal(front.year,1945);assert.equal(front.yearTo,1950);assert.deepEqual(front.brand,['BIX-14']);assert.equal(front.displayId,'42');assert(r.facets.detalles.some(x=>x[1]==='Triciclo'));assert(r.facets.marca.some(x=>x[1].includes('Firma nueva')));assert.equal(r.items.find(x=>x.id==='other').year,null);assert(r.items.some(x=>x.id==='extra'));assert.throws(()=>convert({}),/JSON/);assert.throws(()=>convert({images:{}}),/catalogadas/);const portable=convert({...db,previews:{front:'data:image/jpeg;base64,AA=='}});assert.equal(portable.source.previews.front,'data:image/jpeg;base64,AA==');console.log('PASS: importación, fichas completas, reversos, firma propia, términos nuevos y fechas fuera del período de demostración.');
