import ViewerLayoutClient from './ViewerLayoutClient';

export const metadata = {
  title: 'Tournify — Live Tournament Tracker',
  description: 'Follow live scores, upcoming matches, and results across all sports.',
};

export default function ViewerLayout({ children }) {
  return <ViewerLayoutClient>{children}</ViewerLayoutClient>;
}
