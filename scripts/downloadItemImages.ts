import { Mwn } from 'mwn';
import ProgressBar from 'cli-progress';
import herbloreData from '../src/data/herbloreItems.json';

(async () => {
  const client = new Mwn({apiUrl: 'https://runescape.wiki/api.php'});
  await client.getSiteInfo();

  const bar = new ProgressBar.SingleBar({
    format: 'progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {imageName}',
  }, ProgressBar.Presets.shades_classic);
  bar.start(herbloreData.items.length, 0);
  for (const item of herbloreData.items as any[]) {
    const image = item.image;
    const url = new URL(item.image);
    const fileName = url.pathname.split('/').slice(-1);

    bar.update({imageName: fileName});
    await client.downloadFromUrl(image, `src/assets/potions/${fileName}`);
    bar.increment();
  }

  bar.stop();
})();