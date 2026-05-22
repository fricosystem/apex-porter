import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeColorUpdater from "@/components/theme-color-updater";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "APEX Porter - Sistema de Registro",
  description: "Sistema de registro de entrada e saída para controle de acesso",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icone-site.png", sizes: "any", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icone-site.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "APEX Porter",
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: "APEX Porter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icone-site.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APEX Porter" />
        <meta name="application-name" content="APEX Porter" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-navbutton-color" content="#059669" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ThemeColorUpdater />
          <div id="app-scroll-root">
            {children}
          </div>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <Script
          id="pwa-helpers"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // ── Pull-to-refresh blocker for PWA ──
              // Prevents the browser from refreshing when user pulls down
              // BUT allows scroll inside modals and nested scrollable elements
              (function() {
                var scrollRoot = null;
                var touchStartY = 0;
                var touchStartTarget = null;

                function getScrollRoot() {
                  if (!scrollRoot) scrollRoot = document.getElementById('app-scroll-root');
                  return scrollRoot;
                }

                // Check if the element or any of its parents is a scrollable container
                // that should handle its own scroll events
                function isInsideScrollableElement(element) {
                  var current = element;
                  while (current && current !== document.body) {
                    // Check for dialog, sheet, drawer, or scroll area containers
                    if (current.hasAttribute('data-slot')) {
                      var slot = current.getAttribute('data-slot');
                      if (slot === 'dialog-content' || 
                          slot === 'sheet-content' || 
                          slot === 'drawer-content' ||
                          slot === 'scroll-area-viewport' ||
                          slot === 'tabs-content') {
                        return true;
                      }
                    }
                    // Check for data-scroll-area attribute
                    if (current.hasAttribute('data-scroll-area')) {
                      return true;
                    }
                    // Check for scrollable-list class
                    if (current.classList && current.classList.contains('scrollable-list')) {
                      return true;
                    }
                    // Check for radix scroll area viewport
                    if (current.hasAttribute('data-radix-scroll-area-viewport')) {
                      return true;
                    }
                    // Check if element has overflow-y: auto/scroll and is actually scrollable
                    var style = window.getComputedStyle(current);
                    var overflowY = style.overflowY;
                    if ((overflowY === 'auto' || overflowY === 'scroll') && 
                        current.scrollHeight > current.clientHeight) {
                      return true;
                    }
                    current = current.parentElement;
                  }
                  return false;
                }

                document.addEventListener('touchstart', function(e) {
                  touchStartY = e.touches[0].clientY;
                  touchStartTarget = e.target;
                }, { passive: true });

                document.addEventListener('touchmove', function(e) {
                  // If touch started inside a scrollable element, let it handle scroll
                  if (touchStartTarget && isInsideScrollableElement(touchStartTarget)) {
                    return; // Allow scroll - don't prevent default
                  }

                  var root = getScrollRoot();
                  if (!root) return;

                  var touchY = e.touches[0].clientY;
                  var diff = touchY - touchStartY;

                  // Only block pull-to-refresh: pulling down while at the very top
                  if (diff > 0 && root.scrollTop <= 0) {
                    e.preventDefault();
                  }
                }, { passive: false });
              })();

              // ── Service Worker ──
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registrado com sucesso:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('Falha ao registrar SW:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
