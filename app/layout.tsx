import type { Metadata } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const instrument = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Vaultforge — Abre. Colecciona. Construye.',
  description: 'Simulador de sobres y constructor de mazos de Magic: The Gathering.',
  openGraph: {
    title: 'Vaultforge — Abre. Colecciona. Construye.',
    description: 'Abre productos de Magic, guarda tu colección y crea mazos con recomendaciones.',
    images: [{ url: '/og.png', width: 1536, height: 896, alt: 'Vaultforge — Abre. Colecciona. Construye.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vaultforge — Abre. Colecciona. Construye.',
    description: 'Simulador de sobres y constructor de mazos de Magic.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${geistSans.variable} ${instrument.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
