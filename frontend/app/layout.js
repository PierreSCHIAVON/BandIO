import './globals.css';

export const metadata = {
  title: 'BandIO',
  description: 'BandIO - Collaboration musicale en temps réel',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
