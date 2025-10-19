import {Signal} from 'solid-js';

import {Document} from '../../layer';

export type NumberPair = [number, number];

export type MediaType = 'image' | 'video';

export type ResizableLayer = {
  id: number;
  type: 'text' | 'sticker';
  position: NumberPair;
  rotation: number;
  scale: number;

  sticker?: Document.document;

  textInfo?: TextLayerInfo;
  textRenderingInfo?: TextRenderingInfo;
};

export type TextRenderingInfo = {
  width: number;
  height: number;

  path?: (number | string)[];
  lines: TextRenderingInfoLine[];
};

export type StickerRenderingInfo = {
  container?: HTMLDivElement;
};

export type TextRenderingInfoLine = {
  left: number;
  right: number;
  height: number;
  content: string;
};

export type FontKey = 'roboto' | 'suez' | 'bubbles' | 'playwrite' | 'chewy' | 'courier' | 'fugaz' | 'sedan';

export type TextLayerInfo = {
  color: string;
  alignment: string;
  style: string;
  size: number;
  font: FontKey;
};

export type ResizableLayerProps = {
  layer: ResizableLayer;
};

export type FontInfo = {
  fontFamily: string;
  fontWeight: number;
  baseline: number;
};

export type StandaloneSignal<T> = {
  dispose: () => void;
  signal: Signal<T>;
};
