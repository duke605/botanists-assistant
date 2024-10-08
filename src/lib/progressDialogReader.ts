import { captureHold, captureHoldFullRs, ImgRef, RectLike } from 'alt1';
import progressDialogLeftModern from '@assets/progressLeftModern.png?alt1';
import progressDialogRightModern from '@assets/progressRightModern.png?alt1';
import progressDialogLeftLegacy from '@assets/progressLeftLegacy.png?alt1';
import progressDialogRightLegacy from '@assets/progressRightLegacy.png?alt1';
import { createWorker } from 'tesseract.js';
import { findImageWithFallback } from './image';

let pos: RectLike | undefined;
let workerPromise: ReturnType<typeof createWorker> | undefined;

const ensureProgressDialog = async (img: ImgRef) => {
  const [ leftImgM, rightImgM, leftImgL, rightImgL ] = await Promise.all([
    progressDialogLeftModern,
    progressDialogRightModern,
    progressDialogLeftLegacy,
    progressDialogRightLegacy,
  ]);

  const [ found, left, legacy ] = findImageWithFallback(img, leftImgM, leftImgL);
  if (!found) return [false] as const;

  const right = img.findSubimage(legacy ? rightImgL : rightImgM)[0];
  if (!right) return [false] as const;

  return [true, left, right, legacy ? rightImgL : rightImgM, legacy] as const;
}

export const find = async () => {
  const img = captureHoldFullRs();

  const [ found, left, right, rightImg ] = await ensureProgressDialog(img);
  if (!found) throw new Error('progress_dialog_not_found');

  pos = {
    x: left.x - 6,
    y: left.y - 6,
    width: rightImg.width + right.x + 12 - left.x,
    height: rightImg.height + right.y + 12 - left.y,
  };

  return [pos, img] as const;
};

export const readTitle = async () => {
  const PRODUCT_START_X = 62;
  const PRODUCT_START_Y = 46;
  
  workerPromise ??= createWorker('eng');
  let image: ImageData | undefined;
  while (!image) {
    if (!pos) {
      const [ pos, modalImage ] = await find();
      image = modalImage.read(pos!.x + PRODUCT_START_X, pos!.y + PRODUCT_START_Y, 200, 15);
    } else {
      const tmpImage = captureHold(pos.x, pos.y, 200, 15);
      const [ found ] = await ensureProgressDialog(tmpImage);

      // Can't find progress dialog using cached coords. Unsetting cache and trying to find
      // the dialog using the full screen capture on next loop
      if (!found) {
        pos = undefined;
        continue;
      }

      image = tmpImage.read(pos!.x + PRODUCT_START_X, pos!.y + PRODUCT_START_Y, 200, 15);
    }
  }
  const worker = await workerPromise;
  const titleImg = `data:image/png;base64,${image.toPngBase64()}`;
  
  return await worker.recognize(titleImg);
}