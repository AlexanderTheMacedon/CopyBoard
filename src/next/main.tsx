import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { fixtureLibrary } from './fixtures';
import { previewInfo } from './preview-info';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/board.css';
import './styles/panels.css';

const root = document.getElementById('preview-root');
if (!root) throw new Error('#preview-root is missing');

root.dataset.previewStatus = previewInfo.status;
createRoot(root).render(
  <StrictMode>
    <App library={fixtureLibrary} />
  </StrictMode>,
);
