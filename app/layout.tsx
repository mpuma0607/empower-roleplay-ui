import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Real Estate Roleplay Training',
  description: 'AI-powered roleplay training for real estate agents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Script id="lk-tripwire" strategy="afterInteractive">
          {`
            (function(){
              if (window.__LK_TRIPWIRE__) return; window.__LK_TRIPWIRE__ = true;

              // 1) WebSocket wrapper: log any attempt to hit /rtc and show token length + stack
              const OrigWS = window.WebSocket;
              window.WebSocket = function(url, protocols){
                try {
                  const u = typeof url === 'string' ? url : (url?.toString?.() || '');
                  if (u.includes('/rtc')) {
                    const m = u.match(/[?&]access_token=([^&]*)/);
                    const tok = m ? decodeURIComponent(m[1]) : '';
                    console.warn('[WS]', { access_token_len: tok?.length || 0, url: u.slice(0, 200) });
                    if (!tok) {
                      console.warn('[WS] EMPTY TOKEN — STACK:\\n', new Error().stack);
                    }
                  }
                } catch (e) {}
                return protocols ? new OrigWS(url, protocols) : new OrigWS(url);
              };
              window.WebSocket.prototype = OrigWS.prototype;

              // 2) LiveKit guard (works if LK exposes UMD global)
              const installLKGuard = () => {
                const LK = window.LiveKit;
                if (!LK || !LK.Room) { setTimeout(installLKGuard, 50); return; }
                const orig = LK.Room.prototype.connect;
                LK.Room.prototype.connect = function(url, token, ...rest){
                  console.warn('[LK.connect]', { tokenLen: (token||'').length, tokenPrefix: (token||'').slice(0,12) });
                  if (!token) { throw new Error('[LK.connect] EMPTY TOKEN'); }
                  return orig.call(this, url, token, ...rest);
                };
                console.warn('[LK.connect] guard installed');
              };
              installLKGuard();
            })();
          `}
        </Script>
      </body>
    </html>
  )
}
