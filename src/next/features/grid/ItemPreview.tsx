import type { CSSProperties } from 'react';
import type { AudioItem, ImageItem, Item } from '../../domain/types';
import { excerpt, fileExtension, formatDuration, formatSize } from '../items/item-meta';

// Type-specific semantic preview (D-005). Purely presentational; card vs. inspector scale is decided by CSS.

export function ImageSwatch({ item, className = 'cb-preview cb-preview--image' }: { item: ImageItem; className?: string }) {
  const [a, b, c] = item.palette;
  const style = { '--cb-img-a': a, '--cb-img-b': b, '--cb-img-c': c, '--cb-img-ratio': `${item.width} / ${item.height}` } as CSSProperties;
  return <div className={className} style={style} role="img" aria-label={item.alt} />;
}

export function Waveform({ item, className = 'cb-waveform' }: { item: AudioItem; className?: string }) {
  const bars = item.waveform;
  const width = bars.length * 4;
  return (
    <svg className={className} viewBox={`0 0 ${width} 40`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {bars.map((h, i) => (
        <rect key={i} x={i * 4 + 0.75} y={20 - h * 18} width="2.5" height={h * 36} rx="1.25" />
      ))}
    </svg>
  );
}

export function ItemPreview({ item }: { item: Item }) {
  switch (item.kind) {
    case 'text':
    case 'markdown':
      return (
        <div className={`cb-preview cb-preview--${item.kind}`}>
          <p>{excerpt(item)}</p>
        </div>
      );
    case 'code':
      return (
        <div className="cb-preview cb-preview--code">
          <pre>
            <code>{item.body.split('\n').slice(0, 7).join('\n')}</code>
          </pre>
        </div>
      );
    case 'image':
      return (
        <div className="cb-preview cb-preview--image-frame">
          <ImageSwatch item={item} />
        </div>
      );
    case 'file':
      return (
        <div className="cb-preview cb-preview--file">
          <span className="cb-file-badge">{fileExtension(item.fileName)}</span>
          <span className="cb-preview__caption">{formatSize(item.sizeBytes)}</span>
        </div>
      );
    case 'audio':
      return (
        <div className="cb-preview cb-preview--audio">
          <Waveform item={item} />
          <span className="cb-preview__caption">{formatDuration(item.durationSec)}</span>
        </div>
      );
  }
}
