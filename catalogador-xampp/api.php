<?php
declare(strict_types=1);
// Aplicación exclusivamente local.
if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1','::1'], true)) { http_response_code(403); exit('Acceso local solamente.'); }
session_start();
$_SESSION['token'] = $_SESSION['token'] ?? bin2hex(random_bytes(24));
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function fail(string $s): void { throw new RuntimeException($s); }
function output($v): void { echo json_encode($v, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR); exit; }
$dir = __DIR__.'/datos';
if (!is_dir($dir)) mkdir($dir, 0775, true);
$lock = fopen($dir.'/catalogo.lock','c+');
flock($lock, LOCK_EX);
try {
 $file=$dir.'/catalogo.json';
 $db=is_file($file)?json_decode(file_get_contents($file),true,512,JSON_THROW_ON_ERROR):['folders'=>[], 'images'=>[], 'terms'=>[]];
 $signatureDefaults=json_decode(file_get_contents(__DIR__.'/signatures.json'),true,512,JSON_THROW_ON_ERROR);
 $db['signatures']=array_replace($signatureDefaults,$db['signatures']??[]);
 $action=$_GET['action']??'state';
 $in=[];
 if ($_SERVER['REQUEST_METHOD']==='POST') {
  if (!hash_equals($_SESSION['token'], $_SERVER['HTTP_X_CSRF_TOKEN']??'')) fail('Sesión vencida. Recargá la página.');
  $in=json_decode(file_get_contents('php://input'),true,512,JSON_THROW_ON_ERROR);
 } elseif (!in_array($action,['state','image','export'],true)) fail('Usá POST.');
 if ($action==='state') output(['db'=>$db,'token'=>$_SESSION['token']]);
 // Resolver archivos solo desde una imagen ya incorporada al catálogo.
 if ($action==='image' || $action==='preview') {
  $id=$action==='image'?($_GET['id']??''):($in['id']??'');
  $im=$db['images'][$id]??null; if (!$im) fail('Imagen inexistente.');
  $root=$db['folders'][$im['folder']]['path'];
  $source=realpath($root.DIRECTORY_SEPARATOR.str_replace('/',DIRECTORY_SEPARATOR,$im['relative']));
  $base=realpath($root);
  if (!$source || !$base || strpos($source,$base.DIRECTORY_SEPARATOR)!==0 || !is_file($source) || !is_readable($source)) fail('No se puede leer el archivo original. Revisá la carpeta o la unidad.');
  $ext=strtolower(pathinfo($source,PATHINFO_EXTENSION));
  $version=hash('sha256',$id.':'.filesize($source).':'.filemtime($source));
  $cacheDir=$dir.'/vistas'; $cache=$cacheDir.'/'.$version.'.jpg';
  if ($action==='preview') {
   if (!hash_equals($version,(string)($in['version']??''))) fail('El original cambió; volvé a abrir la imagen.');
   $encoded=$in['jpeg']??'';
   if (!is_string($encoded) || strlen($encoded)>8000000) fail('Vista demasiado grande.');
   $bytes=base64_decode($encoded,true);
   $info=$bytes===false?false:@getimagesizefromstring($bytes);
   if (!$info || $info[2]!==IMAGETYPE_JPEG || max($info[0],$info[1])>2400) fail('La vista no es un JPEG válido.');
   if (!is_dir($cacheDir) && !mkdir($cacheDir,0775,true)) fail('No se pudo crear la carpeta de vistas.');
   if (file_put_contents($cache,$bytes,LOCK_EX)===false) fail('No se pudo guardar la vista.');
   output(['cached'=>true]);
  }
  $path=$source; $mime=['jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp','tif'=>'image/tiff','tiff'=>'image/tiff'][$ext]??'application/octet-stream';
  if (in_array($ext,['tif','tiff'],true)) {
   $legacy=realpath($root.DIRECTORY_SEPARATOR.'.bixio-vistas'.DIRECTORY_SEPARATOR.str_replace('/',DIRECTORY_SEPARATOR,$im['relative']).'.jpg');
   if (is_file($cache)) { $path=$cache; $mime='image/jpeg'; }
   elseif ($legacy && strpos($legacy,$base.DIRECTORY_SEPARATOR)===0 && filemtime($legacy)>=filemtime($source)) { $path=$legacy; $mime='image/jpeg'; }
  }
  header('Content-Type: '.$mime);
  header('X-Image-Version: '.$version);
  header('X-Content-Type-Options: nosniff');
  // No retener bloqueos mientras el navegador recibe un TIFF pesado.
  session_write_close(); flock($lock,LOCK_UN); fclose($lock);
  readfile($path); exit;
 }
 if ($action==='export') { header('Content-Disposition: attachment; filename="bixio-catalogo.json"'); output($db); }
 if ($action==='scan') {
  $root=realpath(trim((string)($in['path']??'')," \t\r\n\""));
  if (!$root || !is_dir($root) || !is_readable($root)) fail('No puedo leer esa carpeta. Pegá la ruta completa de Windows.');
  $fid=hash('sha256',$root); $db['folders'][$fid]=['path'=>$root,'name'=>basename($root)];
  $it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS)); $added=0;
  foreach($it as $f) {
   if (!$f->isFile() || $f->isLink()) continue;
   $rel=str_replace('\\','/',substr($f->getPathname(),strlen($root)+1));
   if (strpos($rel,'.bixio-vistas/')===0 || !in_array(strtolower($f->getExtension()),['tif','tiff','jpg','jpeg','png','webp'])) continue;
   $id=hash('sha256',$fid.'/'.$rel);
   if (!isset($db['images'][$id])) { $db['images'][$id]=['id'=>$id,'folder'=>$fid,'relative'=>$rel,'status'=>'pending','record'=>new stdClass(),'revision'=>0]; $added++; }
  }
  $result=['added'=>$added,'folder'=>$fid];
 } elseif ($action==='add_signature') {
  $name=$in['name']??'';
  if (!is_string($name)) fail('Descripción de firma inválida.');
  $name=trim(preg_replace('/\\s+/u',' ',$name));
  if ($name==='' || strlen($name)>600) fail('Escribí una descripción de hasta 600 bytes.');
  $fold=function($value) { return function_exists('mb_strtolower')?mb_strtolower($value,'UTF-8'):strtolower($value); };
  $code=null; $max=0;
  foreach ($db['signatures'] as $key=>$value) {
   if ($fold($value)===$fold($name)) $code=$key;
   if (preg_match('/^BIX-(\\d+)$/',$key,$match)) $max=max($max,(int)$match[1]);
  }
  if ($code===null) { $code='BIX-'.str_pad((string)($max+1),2,'0',STR_PAD_LEFT); $db['signatures'][$code]=$name; }
  $result=['code'=>$code,'signatures'=>$db['signatures']];
 } elseif ($action==='save') {
  $id=$in['id']??''; if (!isset($db['images'][$id])) fail('Archivo inexistente.');
  $im=&$db['images'][$id]; if (($in['revision']??-1)!==($im['revision']??0)) fail('El registro cambió en otra ventana. Recargá antes de guardar.');
  $r=$in['record']??[]; if (!is_array($r)) fail('Registro inválido.');
  $clean=[];
  foreach(['side','number','date','kind','portrait','frame','direction','environment','notes','parent','signature'] as $key) {
   $v=$r[$key]??''; if (!is_string($v) || strlen($v)>5000) fail('Campo inválido: '.$key); $clean[$key]=trim($v);
  }
  if ($clean['signature']!=='' && !isset($db['signatures'][$clean['signature']])) fail('Elegí una firma existente o agregala con el botón Nueva firma.');
  if (!in_array($clean['side'],['Frente','Reverso','Tapa','Otros'],true)) fail('Elegí frente, reverso, tapa u otros.');
  if ($clean['parent']!=='' && ($clean['parent']===$id || !isset($db['images'][$clean['parent']]))) fail('Vínculo de imagen inválido.');
  foreach(['people','objects','highlights'] as $key) {
   $values=$r[$key]??[]; if (!is_array($values) || count($values)>100) fail('Lista inválida.');
   $clean[$key]=[];
   foreach($values as $v) { if (!is_string($v) || strlen($v)>200) fail('Término inválido.'); if (trim($v)!=='') $clean[$key][]=trim($v); }
   $clean[$key]=array_values(array_unique($clean[$key]));
   $db['terms'][$key]=array_values(array_unique(array_merge($db['terms'][$key]??[],$clean[$key])));
  }
  if ($clean['kind']!=='Retrato') foreach(['portrait','frame','direction'] as $k) $clean[$k]='';
  $im['record']=$clean; $im['status']=($in['complete']??false)?'done':'draft'; $im['revision']=($im['revision']??0)+1; $im['updated']=date(DATE_ATOM);
  $result=['image'=>$im];
 } else fail('Acción desconocida.');
 $json=json_encode($db,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR);
 if (is_file($file) && !copy($file,$dir.'/catalogo.anterior.json')) fail('No se pudo crear el respaldo.');
 $tmp=tempnam($dir,'catalogo-'); if(file_put_contents($tmp,$json)===false) fail('No se pudo guardar.');
 // Windows no permite reemplazar mediante rename en algunas instalaciones: copy mantiene el bloqueo.
 if (!copy($tmp,$file)) { unlink($tmp); fail('No se pudo escribir el catálogo.'); } unlink($tmp);
 output($result);
} catch(Throwable $e) { http_response_code(400); output(['error'=>$e->getMessage()]); }
