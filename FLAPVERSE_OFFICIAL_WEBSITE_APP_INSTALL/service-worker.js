const CACHE='flapverse-app-v3';
const CORE=['./','./index.html','./play.html','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./game/flapverse.html'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{try{const r=await fetch(e.request);const c=await caches.open(CACHE);c.put(e.request,r.clone());return r}catch(err){return (await caches.match(e.request))||(await caches.match('./index.html'))}})())});
