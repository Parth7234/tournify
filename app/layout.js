import './globals.css';

export const metadata = {
  title: 'Tournify — Live College Tournament Tracker',
  description: 'Track live scores, upcoming matches, and results for your college sports tournaments. Cricbuzz-style experience for campus sports.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
