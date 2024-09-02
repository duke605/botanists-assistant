import { Mwn } from 'mwn';
import herbloreData from '../src/data/herbloreItems.json';

(async () => {
  const client = new Mwn({apiUrl: 'https://runescape.wiki/api.php'});
  await client.getSiteInfo();


  for (const item of Object.values(herbloreData.items) as any[]) {
    const image = item.image;
    const url = new URL(item.image);
  
    await client.downloadFromUrl(image, `src/assets/potions/${url.pathname.split('/').slice(-1)}`);
  }
})();