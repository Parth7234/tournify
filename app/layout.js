import './globals.css';

export const metadata = {
  title: 'Tournify — Live College Tournament Tracker',
  description: 'Track live scores, upcoming matches, and results for your college sports tournaments. Cricbuzz-style experience for campus sports.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
