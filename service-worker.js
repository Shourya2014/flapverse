const CACHE='flapverse-app-v4-loading-fix';
const CORE=['./','./index.html','./play.html','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./game/flapverse.html'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(CORE.map(url=>cache.add(url)));
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

async function networkWithTimeout(request,ms=3500){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try {
    return await fetch(request,{signal:controller.signal});
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(event.request,{ignoreSearch:true});

    // The 3+ MB game file should open instantly from cache, then refresh silently.
    if(url.pathname.endsWith('/game/flapverse.html') && cached){
      event.waitUntil((async()=>{
        try{
          const fresh=await networkWithTimeout(event.request,5000);
          if(fresh && fresh.ok) await cache.put(event.request,fresh.clone());
        }catch(_){}
      })());
      return cached;
    }

    // Other files: network first, but never wait forever.
    try{
      const fresh=await networkWithTimeout(event.request,3500);
      if(fresh && fresh.ok) await cache.put(event.request,fresh.clone());
      return fresh;
    }catch(err){
      if(cached) return cached;
      return (await cache.match('./index.html')) || Response.error();
    }
  })());
});
