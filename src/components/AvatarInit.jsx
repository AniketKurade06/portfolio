import React from 'react';
import { createRoot } from 'react-dom/client';
import Lanyard from './Lanyard.jsx';

const rootElement = document.getElementById('avatar-root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} frontImage="/my-img.png" imageFit="contain" />);
}
