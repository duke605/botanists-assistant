import { Plugin } from 'vite';
import data from '../src/data/herbloreItems.json';

export default (): Plugin => {
  const pluginId = 'virtual:item-images';

  return {
    name: 'virtual-item-images',
    resolveId(id) {
      if (id === pluginId) return `\0${id}`;
    },
    load(id) {
      if (id !== `\0${pluginId}`) return;

      return `
        ${Object.values(data.items).map(item => `
          import image${item.id} from "@assets/potions/${item.image.split('/').slice(-1)[0]}?url";
        `.trim()).join('\n')}

        export default {
          ${Object.values(data.items).map(item => `
            '${item.id}': image${item.id},
          `.trim()).join('\n')}
        }
      `;
    },
  }
};