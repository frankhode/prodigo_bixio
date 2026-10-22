'use strict';
// Mismo decodificador incluido en el catalogador de montadas.
importScripts('tiff-decoder.js');
self.onmessage = event => {
  try {
    const buffer=event.data, ifds=UTIF.decode(buffer);
    if(!ifds.length)throw Error('El TIFF no contiene imágenes.');
    UTIF.decodeImage(buffer,ifds[0]);
    const width=ifds[0].width,height=ifds[0].height,rgba=UTIF.toRGBA8(ifds[0]);
    self.postMessage({width,height,rgba},[rgba.buffer]);
  } catch(error) {self.postMessage({error:error.message||'No se pudo leer este TIFF.'});}
};
