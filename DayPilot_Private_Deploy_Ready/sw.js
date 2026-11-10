// DayPilot access-code edition: never cache protected pages, files or user content.
const NAME='daypilot-shell-v4-pin1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('daypilot-')).map(k=>caches.delete(k)));await self.clients.claim()})())});
// All requests go to the server, so the access-code gate cannot be bypassed by this SW.
self.addEventListener('fetch',e=>{if(new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.openWindow('/'))});
