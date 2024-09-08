import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';
import { ImageDetect } from 'alt1';
import virtualItemImages from './plugins/virtualItemImages';
import virtualChangelog from './plugins/virtualChangelog';

const alt1ImageLoader: Plugin = {
  name: "alt1-image-loader",
  transform(_: any, id: string) {
    const [path, query] = id.split("?");
    if (query != "alt1") return null;

    const data = fs.readFileSync(path);
    ImageDetect.clearPngColorspace(data);
    const base64 = data.toString("base64");

    return `import { ImageDetect } from 'alt1';\nexport default ImageDetect.imageDataFromBase64('${base64}');`;
  },
};

// const alt1FontLoader: Plugin = {
//   name: "alt1-font-loader",
//   async transform(_: any, id: string) {
//     const [path, query] = id.split("?");
//     if (query != "alt1font") return null;
    
//     const source = fs.readFileSync(path).toString();
//     const imgsrc = path.replace(/\.fontmeta\.json$/, ".data.png");
//     const bytes = fs.readFileSync(imgsrc);
    
// 		var byteview = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
// 		ImageDetect.clearPngColorspace(byteview);

//     //currently still need the sharp package instead of node-canvas for this to prevent losing precision due to premultiplied alphas
//     var imgfile = sharp(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
//     const imgdata = await imgfile.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
//     if (imgdata.info.premultiplied) { console.warn("png unpacking used premultiplied alpha, pixels with low alpha values have suffered loss of precision in rgb channels"); }

//     var img = new ImageData(new Uint8ClampedArray(imgdata.data.buffer), imgdata.info.width, imgdata.info.height);
//     const font = OCR.loadFontImage(img, JSON.parse(source));

//     return `export default ${JSON.stringify(font)};`
//   },
// };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [alt1ImageLoader, virtualItemImages(), virtualChangelog(), react()],
  base: '/botanists-assistant',
  build: {
    assetsInlineLimit: (filepath) => {
      const file = path.parse(filepath);
      return file.name === 'appconfig' ? false : true;
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) => {
          return asset.name !== 'appconfig.json'
            ? 'assets/[name]-[hash][extname]'
            : 'assets/[name][extname]';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, './src/lib'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@data': path.resolve(__dirname, './src/data'),
      '@state': path.resolve(__dirname, './src/state'),
    },
  },
});
