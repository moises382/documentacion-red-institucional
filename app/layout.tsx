import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Documentación de red | Proyecto personal',
  description:
    'Inventario, topología y seguimiento de una red institucional con datos de demostración.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
