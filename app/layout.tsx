import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'WeaveHelp',
  description: 'Created by AI Engineering Team',
  icons: {
    icon: '/weavehelp-icon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Completely remove Next.js development elements */
            [data-nextjs-toast-wrapper],
            [data-next-badge-root],
            [data-nextjs-dev-tools-button],
            [data-nextjs-toast-wrapper] *,
            [data-next-badge-root] *,
            [data-nextjs-dev-tools-button] * {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              position: absolute !important;
              left: -9999px !important;
              top: -9999px !important;
              width: 0 !important;
              height: 0 !important;
              overflow: hidden !important;
            }
            
            /* Target any element with nextjs in data attributes */
            [data-*="nextjs"],
            [data-*="next-js"],
            [data-*="next"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
            
            /* Hide any toast-like elements */
            [data-toast],
            [data-toast-wrapper],
            [data-toast-container] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
          `
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Remove Next.js dev tools on page load
            document.addEventListener('DOMContentLoaded', function() {
              function removeNextJSElements() {
                const selectors = [
                  '[data-nextjs-toast-wrapper]',
                  '[data-next-badge-root]',
                  '[data-nextjs-dev-tools-button]',
                  '[data-nextjs-toast-wrapper] *',
                  '[data-next-badge-root] *',
                  '[data-nextjs-dev-tools-button] *'
                ];
                
                selectors.forEach(selector => {
                  const elements = document.querySelectorAll(selector);
                  elements.forEach(el => {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.opacity = '0';
                    el.style.pointerEvents = 'none';
                    el.style.position = 'absolute';
                    el.style.left = '-9999px';
                    el.style.top = '-9999px';
                    el.style.width = '0';
                    el.style.height = '0';
                    el.style.overflow = 'hidden';
                  });
                });
              }
              
              // Run immediately
              removeNextJSElements();
              
              // Run after a short delay to catch dynamically added elements
              setTimeout(removeNextJSElements, 100);
              setTimeout(removeNextJSElements, 500);
              setTimeout(removeNextJSElements, 1000);
              
              // Watch for new elements
              const observer = new MutationObserver(removeNextJSElements);
              observer.observe(document.body, { childList: true, subtree: true });
            });
          `
        }} />
      </head>
      <body className={`${poppins.variable} font-poppins`}>{children}</body>
    </html>
  )
}
