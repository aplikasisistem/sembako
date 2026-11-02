/**
 * PWA Service Worker Registration & Auto-Update Controller
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully:', registration.scope);

          // Check for updates on load & interval
          registration.update();

          // Triggered when a new service worker has installed and is waiting
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available! Prompting update...');
                  triggerUpdatePrompt(newWorker);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Ensure single reload when new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] Controller changed, reloading application...');
          window.location.reload();
        }
      });
    });
  }
}

function triggerUpdatePrompt(newWorker: ServiceWorker) {
  // Automatically tell the new service worker to skip waiting and activate immediately for seamless updates
  newWorker.postMessage({ type: 'SKIP_WAITING' });
  
  // Optional lightweight toast or silent auto-reload
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce';
  toast.innerHTML = `
    <span>🔄 Pembaruan PANDIR STORE tersedia! Memuat ulang...</span>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    window.location.reload();
  }, 1200);
}
