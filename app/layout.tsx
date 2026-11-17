import type { Metadata } from 'next';
import './globals.css';
import './theme.css';

export const metadata: Metadata = {
  title: 'Documentación de red | Proyecto personal',
  description:
    'Inventario, topología y seguimiento de una red institucional con datos de demostración.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var m=localStorage.getItem('red-institucional.theme');var d=m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
