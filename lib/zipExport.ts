import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { padNum } from './utils';
import type { Photo } from './types';

export async function downloadPhotosAsZip(
  photos: Photo[],
  fileNamePrefix = 'product-photo'
): Promise<void> {
  const zip = new JSZip();
  let i = 1;
  for (const p of photos) {
    if (!p.finalBlob) continue;
    const name = `${fileNamePrefix}-${padNum(i, 2)}.png`;
    zip.file(name, p.finalBlob);
    i++;
  }
  const out = await zip.generateAsync({ type: 'blob' });
  saveAs(out, `${fileNamePrefix}-bundle.zip`);
}

export function downloadSinglePhoto(photo: Photo, index: number, prefix = 'product-photo') {
  if (!photo.finalBlob) return;
  saveAs(photo.finalBlob, `${prefix}-${padNum(index, 2)}.png`);
}
