// Contract of the preview track. The preview never writes data and never talks to a backend.
export const previewInfo = {
  name: 'CopyBoard Preview',
  status: 'react-foundation',
  writesEnabled: false,
  cloudEnabled: false,
} as const;

export type PreviewInfo = typeof previewInfo;
