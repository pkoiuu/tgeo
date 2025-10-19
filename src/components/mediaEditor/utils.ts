import {getOwner, runWithOwner} from 'solid-js';

import BezierEasing from '../../vendor/bezierEasing';
import {hexaToHsla} from '../../helpers/color';
import {logger} from '../../lib/logger';

import {FontInfo, FontKey, NumberPair, ResizableLayer} from './types';
import {HistoryItem} from './context';
import {IS_FIREFOX} from '../../environment/userAgent';

export const log = logger('Media editor');


export const delay = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout));

export function withCurrentOwner<Args extends Array<unknown>, Result>(fn: (...args: Args) => Result) {
  const owner = getOwner();
  return (...args: Args) => {
    return runWithOwner(owner, () => fn(...args));
  };
}

export function distance(p1: NumberPair, p2: NumberPair) {
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
}

export function snapToViewport(ratio: number, vw: number, vh: number) {
  if(vw / ratio > vh) vw = vh * ratio;
  else vh = vw / ratio;

  return [vw, vh] as NumberPair;
}

export function getSnappedViewportsScale(ratio: number, vw1: number, vh1: number, vw2: number, vh2: number) {
  [vw1, vh1] = snapToViewport(ratio, vw1, vh1);
  [vw2, vh2] = snapToViewport(ratio, vw2, vh2);

  return Math.max(vw1 / vw2, vh1 / vh2);
}

export function getContrastColor(color: string) {
  return hexaToHsla(color).l < 80 ? '#ffffff' : '#000000';
}

export function lerp(min: number, max: number, progress: number) {
  return min + (max - min) * progress;
}

export function lerpArray(min: number[], max: number[], progress: number) {
  return min.map((start, index) => start + (max[index] - start) * progress);
}


// const isPureObject = (obj: any) => [Object.prototype, null].includes(Object.getPrototypeOf(obj));
const isObject = (obj: any) => obj instanceof Object;

const COMPARISON_ERROR = 0.001;

export function approximateDeepEqual(x: any, y: any): boolean {
  if(typeof x === 'number' && typeof y === 'number') return Math.abs(x - y) < COMPARISON_ERROR;

  if(x === y) return true;

  if(x instanceof Array && y instanceof Array)
    return x.length === y.length && x
    .every((value, idx) => approximateDeepEqual(value, y[idx]));


  if(isObject(x) && isObject(y))
    return Array
    .from(new Set([...Object.keys(x), ...Object.keys(y)]))
    .every(key => approximateDeepEqual(x[key], y[key]))


  return false;
}


type AnimateValueOptions = {
  easing?: (progress: number) => number;
  onEnd?: () => void;
};

const defaultEasing = BezierEasing(0.42, 0.0, 0.58, 1.0);
export const simpleEasing = BezierEasing(0.25, 0.1, 0.25, 1);

export function animateValue<T extends number | number[]>(
  start: T,
  end: T,
  duration: number,
  callback: (value: T) => void,
  {easing = defaultEasing, onEnd = () => {}}: AnimateValueOptions = {}
) {
  let startTime: number;
  let canceled = false;

  function animateFrame(currentTime: number) {
    if(canceled) return;
    if(!startTime) startTime = currentTime;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    if(start instanceof Array && end instanceof Array) {
      const currentValues = start.map((startVal, index) => lerp(startVal, end[index], easedProgress));
      callback(currentValues as T);
    } else {
      callback(lerp(start as number, end as number, easedProgress) as T);
    }

    if(progress < 1) {
      requestAnimationFrame(animateFrame);
    } else {
      onEnd();
    }
  }

  requestAnimationFrame(animateFrame);

  return () => {
    canceled = true;
  };
}

export function processHistoryItem(item: HistoryItem, mediaState: any) {
  const path = [...item.path].reverse() as (keyof any)[];
  if(!path?.length) return;

  let obj = mediaState;

  while(path.length > 1)
    obj = obj[path.pop()];

  let key = path.pop();

  if(obj instanceof Array) {
    key = key as number;
    if(item.findBy) key = obj.findIndex((value) => value?.id === item.findBy.id);
    if(key === -1) key = obj.length;

    if(item.newValue === HistoryItem.RemoveArrayItem)
      obj.splice(key, 0, item.oldValue);
    else if(item.oldValue === HistoryItem.RemoveArrayItem)
      obj.splice(key, 1);
    else
      obj[key] = item.oldValue;
  } else {
    obj[key] = item.oldValue;
  }
}

export function traverseObjectDeep(obj: any) {
  if(obj instanceof Array) obj.forEach(val => traverseObjectDeep(val));
  else if(obj instanceof Object) Object.values(obj).forEach(val => traverseObjectDeep(val));
}

export function cleanupWebGl(gl: WebGLRenderingContext) {
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}

export const availableQualityHeights = [
  240,
  360,
  480,
  600, // non-standard, but prevents big quality jumps
  720,
  1080
];

export function snapToAvailableQuality(videoHeight: number) {
  const ALLOWED_THRESHOLD = 0.8;

  for(let i = availableQualityHeights.length - 1; i > 0; i--) {
    const higher = availableQualityHeights[i], lower = availableQualityHeights[i - 1];
    const diff = higher - lower;

    if(videoHeight > lower + diff * ALLOWED_THRESHOLD) return higher;
  }

  return availableQualityHeights[0];
}

export function checkIfHasAnimatedStickers(layers: ResizableLayer[]) {
  return !!layers.find((layer) => {
    const stickerType = layer.sticker?.sticker;
    return stickerType === 2 || (!IS_FIREFOX && stickerType === 3);
  });
};

export const fontInfoMap: Record<FontKey, FontInfo> = {
  roboto: {
    fontFamily: '\'Roboto\'',
    fontWeight: 500,
    baseline: 0.75
  },
  suez: {
    fontFamily: '\'Suez One\'',
    fontWeight: 400,
    baseline: 0.75
  },
  bubbles: {
    fontFamily: '\'Rubik Bubbles\'',
    fontWeight: 400,
    baseline: 0.75
  },
  playwrite: {
    fontFamily: '\'Playwrite BE VLG\'',
    fontWeight: 400,
    baseline: 0.85
  },
  chewy: {
    fontFamily: '\'Chewy\'',
    fontWeight: 400,
    baseline: 0.75
  },
  courier: {
    fontFamily: '\'Courier Prime\'',
    fontWeight: 700,
    baseline: 0.65
  },
  fugaz: {
    fontFamily: '\'Fugaz One\'',
    fontWeight: 400,
    baseline: 0.75
  },
  sedan: {
    fontFamily: '\'Sedan\'',
    fontWeight: 400,
    baseline: 0.75
  }
};
