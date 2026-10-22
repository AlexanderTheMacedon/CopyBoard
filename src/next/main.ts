import { previewInfo } from './preview-info';

const root = document.getElementById('preview-root');
if (!root) throw new Error('#preview-root is missing');

root.dataset.previewStatus = previewInfo.status;
root.textContent = `${previewInfo.name} · ${previewInfo.status} · read-only, no storage, no sync`;
