import { Mwn, Template } from 'mwn';
import fs from 'node:fs';

interface Page {
  title: string;
  pageid: number;
  revisions: {
    slots: {
      main: {
        content: string;
      }
    }
  }[];
  categories?: {
    ns: number;
    title: string;
  }[];
}

interface InfoboxItem {
  id: number;
  name: string;
  image: string;
  update: string;
  noteable: boolean;
  isDefault: boolean;
  version?: string;
  tradable: 'YES' | 'NO' | 'RESTRICTED';
  release: string;
  weight: number;
  examine: string;
  members: boolean;
  equipable: boolean;
  stackable: boolean;
  removal?: string;
}

const templateToString = (template: Template) => {
  let b = `{{${template.name}`;
  for (const param of template.parameters) {
    b += `|${param.name}=${param.value}`;
  }
  return b + '}}';
}

const fixPages = async (client: Mwn, pages: Page[]) => {
  for (const page of pages) {
    const templates = new client.Wikitext(page.revisions[0].slots.main.content).parseTemplates({recursive: true});

    // Fixing the magic potion page
    if (page.title === 'Magic potion') {
      let content = page.revisions[0].slots.main.content;
      content = content.replace(/\{\{\/Recipe\|(.+?) bead\}\}/g, '{{Infobox Recipe|members = No|ticks = 2|ticks2 = 1|ticksnote = When mixing a single potion|skill1 = Herblore|skill1lvl = 5|skill1boostable = |skill1exp = 35|mat1 = Tarromin potion (unf)|mat2 = $1 bead|output1 = Magic potion (3)|smw = <includeonly>Yes</includeonly><noinclude>No</noinclude>}}');
      page.revisions[0].slots.main.content = content;
    }

    // Fixing pages with creation templates
    const creationTemplate = templates.find(t => (t.name as string).toLowerCase?.().endsWith('/creation'));
    if (creationTemplate) {
      const creationTmplName = (creationTemplate.name as string).replace(/^:/, '');
      const result = await client.query({
        titles: `Template:${creationTmplName}`,
        format: 'json',
        prop: 'revisions',
        formatversion: 2,
        rvprop: 'content',
        redirects: 1,
        rvslots: 'main',
      });
      const pages = result.query!.pages as Page[];

      // Fixing recipe template specifically for adrenaline renewal potions because it has 2 recipe boxes
      const templates =  new client.Wikitext(pages[0].revisions[0].slots.main.content).parseTemplates({});
      if (creationTmplName.toLowerCase() === 'adrenaline renewal potion/creation') {
        const localTemplates = templates.filter(t => (t.name as string).toLowerCase?.() === 'switch infobox');
        const prefixWith = ['From super adrenaline', 'From enhanced replenishment'];
        for (let i = 0; i < localTemplates.length; i++) {
          const tmpl = localTemplates[i];
          const prefix = prefixWith[i];
          for (let i = 1; i <= 2; i++) {
            const text = tmpl.getParam(`text${i}`);
            text.value = `${prefix} - ${text.value}`.replace(' - Regular', '');
          }
        }
      }

      // Turning templates back into strings and replacing the creation template with them
      let content = page.revisions[0].slots.main.content;
      content = content.replace(creationTemplate.wikitext, templates.map(templateToString).join(''));
      page.revisions[0].slots.main.content = content;
    }

    // Fixing Guthix balance (unf) page. For some reason the name doesn't include the dose
    if (page.title === 'Guthix balance (unf)') {
      const itemTemplate = templates.find(t => (t.name as string).toLowerCase?.() === 'infobox item')!;
      itemTemplate.addParam('name1', 'Guthix balance (unf) (1)', '');
      itemTemplate.addParam('name2', 'Guthix balance (unf) (2)', '');
      itemTemplate.addParam('name3', 'Guthix balance (unf) (3)', '');
      itemTemplate.addParam('name4', 'Guthix balance (unf) (4)', '');

      let content = page.revisions[0].slots.main.content;
      content = content.replace(itemTemplate.wikitext, templateToString(itemTemplate));
      page.revisions[0].slots.main.content = content;
    }
  }
} 

const parseInfoboxItem = (client: Mwn, tmpl: Template) => {
  const items: InfoboxItem[] = [];

  const convertYesOrNoToBoolean = (s: string) => {
    const capsS = s.toUpperCase();
    if (capsS === 'YES') return true;
    if (capsS === 'NO') return false;

    throw new Error(`Expected 'Yes' or 'No'. Got '${s}'`);
  }

  const getVersionedParam = (version: number, param: string) => {
    const versionParam = `${param}${version}`;
    const value = tmpl.getValue(versionParam) ?? tmpl.getValue(param);

    return value;
  }

  const getVersions = () => {
    const versions = [] as number[];

    if (tmpl.getValue(`version1`) === null) versions.push(0); // 0 means there is an unversion version
    for (let i = 1; tmpl.getValue(`version${i}`) !== null; i++) {
      versions.push(i);
    }

    return versions;
  }

  const versions = getVersions();
  const defver = tmpl.getValue('defver') ?? versions[0];
  try {
    for (const v of versions) {
      const imageWikiText = new client.Wikitext(getVersionedParam(v, 'image')!);
      imageWikiText.parseLinks();
      const item = {
        id: +getVersionedParam(v, 'id')!,
        name: getVersionedParam(v, 'name')!,
        update: getVersionedParam(v, 'update')!,
        release: getVersionedParam(v, 'release')!,
        version: getVersionedParam(v, 'version') ?? undefined,
        weight: +(getVersionedParam(v, 'weight') || '0'),
        examine: getVersionedParam(v, 'examine')!,
        tradable: (getVersionedParam(v, 'tradeable') ?? getVersionedParam(v, 'tradable'))!.toLowerCase() as any,
        noteable: convertYesOrNoToBoolean(getVersionedParam(v, 'noteable')! ?? 'NO'),
        equipable: convertYesOrNoToBoolean(getVersionedParam(v, 'equipable')!),
        stackable: convertYesOrNoToBoolean(getVersionedParam(v, 'stackable')!),
        quest: (getVersionedParam(v, 'quest')?.toLowerCase() ?? 'no') === 'no',
        members: convertYesOrNoToBoolean(getVersionedParam(v, 'members')!),
        removal: getVersionedParam(v, 'removal') ?? undefined,
        isDefault: v === defver,
        image: `https://runescape.wiki/images/${imageWikiText.files[0].target.getMain()}`,
      };

      const required = ['id', 'name', 'update', 'release', 'weight', 'examine', 'tradable', 'noteable', 'equipable', 'stackable', 'quest', 'members', 'isDefault', 'image'];
      for (const field of required) {
        const value = item[field];

        if (value !== false && value !== 0 && !value) throw new Error(`Expect ${field}. ${tmpl.wikitext}`);
      }

      items.push(item);
    }
  } catch (e) {
    console.log(tmpl.wikitext);
    throw e;
  }

  return items;
}

const parseInfoboxRecipe = (name: string, tmpl: Template, idsByName: Record<string, number>) => {
  if (!tmpl.getValue('skill1lvl')) return;

  const recipe = {
    name,
    outputId: idsByName[tmpl.getValue('output1')!?.replace('&#39;', "'")],
    exp: +(tmpl.getValue('skill1exp') ?? '0'),
    herbLevel: +(tmpl.getValue('skill1lvl') ?? 'skill1lvl'),
    quantity: +(tmpl.getValue('output1qty') ?? tmpl.getValue('quantity') ?? '1'),
    ticks: [],
    inputs: [],
  } as {
    exp: number;
    outputId: number;
    quantity: number;
    herbLevel: number;
    name: string;
    ticks: number[];
    inputs: {
      name: string;
      itemId: number;
      quantity: number;
      isSecondary: boolean;
    }[];
  };
  if (!recipe.outputId) throw new Error('Expected outputId for ' + tmpl.getValue('output1'));

  let tick = tmpl.getValue('ticks');
  if (tick && tick !== 'varies') recipe.ticks.push(+tick);
  tick = tmpl.getValue('ticks2');
  if (tick && tick !== 'varies') recipe.ticks.push(+tick);

  for (let i = 1; tmpl.getValue(`mat${i}`); i++) {
    const matName = `mat${i}`;
    const matValue = tmpl.getValue(matName)!;
    const itemId = idsByName[matValue];
    if (!itemId) throw new Error('Expected matId for ' + matValue);

    recipe.inputs.push({
      itemId: itemId,
      isSecondary: i !== 1,
      name: matValue,
      quantity: +(tmpl.getValue(`mat${i}qty`) ?? '1'),
    });
  }

  return recipe;
}

const parseSwitchboxRecipes = (client: Mwn, tmpl: Template, idsByName: Record<string, number>) => {
  const recipes = [] as ReturnType<typeof parseInfoboxRecipe>[];

  for (let i = 1; tmpl.getValue(`item${i}`); i++) {
    const name = tmpl.getValue(`text${i}`) ?? 'Regular';
    if (name.toLowerCase().includes('unfinished')) continue;
    const infoboxRecipe = (new client.Wikitext(tmpl.getValue(`item${i}`)!)).parseTemplates({})[0];

    recipes.push(parseInfoboxRecipe(name, infoboxRecipe, idsByName));
  }

  return recipes;
}

const isValidPotion = (client: Mwn, page: Page) => {
  if (page.title === 'Blessed flask') return false;
  if (page.title === 'Coconut milk') return false;
  if (page.title === 'Antidote') return false;
  if (!page.categories?.some(c => c.title === 'Category:Items')) return false;
  if (page.categories?.some(c => c.title === 'Category:Quest items')) return false;
  if (page.categories?.some(c => c.title === 'Category:Permanently discontinued items')) return false;
  if (page.categories?.some(c => c.title === 'Category:Minigame items')) return false;
  if (!page.revisions[0]?.slots?.main?.content) return false;

  const wikiText = page.revisions[0].slots.main.content;
  const parsedWikiText = new client.Wikitext(wikiText);
  const templates = parsedWikiText.parseTemplates({recursive: true});
  const itemInfobox = templates.find(t => (t.name as string).toLowerCase?.() === 'infobox item')!;
  
  return !itemInfobox.getValue('removal') &&
    (itemInfobox.getValue('quest') ?? 'No').toUpperCase() === 'NO' &&
    templates.some(t =>
      (t.name as string).toLowerCase?.() === 'infobox recipe' &&
      t.getValue('skill1') === 'Herblore' &&
      t.getValue('skill1lvl') &&
      t.getValue('quest')?.toLowerCase() !== 'yes'
    );
};

(async () => {
  const client = new Mwn({
    apiUrl: 'https://runescape.wiki/api.php',
  });
  await client.getSiteInfo();

  const allPotions: Page[] = [];
  let cont: Record<string, string> | undefined;
  do {
    const result = await client.query({
      ...cont,
      format: 'json',
      prop: 'revisions|categories',
      generator: 'categorymembers',
      formatversion: 2,
      rvprop: 'content',
      rvslots: 'main',
      cllimit: 500,
      gcmtitle: 'Category:Potions',
      gcmlimit: 10,
    });
    cont = result.continue;
    const pages = result.query!.pages as Page[];

    await fixPages(client, pages);
    const potions = pages.filter(p => isValidPotion(client, p));
    
    allPotions.push(...potions);
  } while (cont);

  const inputs = [] as string[];
  const deferredInputs: Function[] = [];
  const deferredRecipes: Function[] = [];
  const db = allPotions.reduce((map, potion) => {
    let content = potion.revisions[0].slots.main.content

    const wikiText = new client.Wikitext(content);
    const templates = wikiText.parseTemplates({recursive: true});
    const items = parseInfoboxItem(client, templates.find(t => (t.name as string).toLowerCase?.() === 'infobox item')!) as (InfoboxItem & {
      doses?: number;
      pageName: string;
      pageId: number;
      relatedIds?: number[];
      recipes?: ReturnType<typeof parseInfoboxRecipe>[];
    })[];

    map.pages[potion.pageid] = {
      id: potion.pageid,
      name: potion.title,
      content: content,
      categories: potion.categories?.map(c => c.title) ?? [],
    };

    for (const item of items) {
      map.idLookup[item.name] = item.id;
      item.pageName = potion.title;
      item.pageId = potion.pageid;

      if (items.length > 1) item.relatedIds = items.filter(i => i.id !== item.id).map(i => i.id);
      const match = item.version?.match(/^\((?<doses>\d)\)$/);
      if (match) item.doses = +match!.groups!.doses;
      
      map.items[item.id] = item;
    }

    deferredInputs.push(() => {
      const infoboxRecipes = templates.filter(t => (t.name as string).toLowerCase?.() === 'infobox recipe');
      for (const recipe of infoboxRecipes) {
        for (let i = 1; recipe.getValue(`mat${i}`); i++) {
          const matName = `mat${i}`;
          const matValue = recipe.getValue(matName)!;

          if (map.idLookup[matValue]) continue;
          if (inputs.find(i => i === matValue)) continue;

          inputs.push(matValue);
        }
      }
    });

    deferredRecipes.push(async () => {
      const infoboxRecipes = templates.filter(t => (t.name as string).toLowerCase?.() === 'infobox recipe');
      const switchInfoboxes = templates.filter(t => (t.name as string).toLowerCase?.() === 'switch infobox');
      const recipes = [] as ReturnType<typeof parseInfoboxRecipe>[];
      if (switchInfoboxes.length) {
        for (const switchInfobox of switchInfoboxes)
          recipes.push(...parseSwitchboxRecipes(client, switchInfobox, map.idLookup));
      } else if (infoboxRecipes.length) {
        for (const infoboxRecipe of infoboxRecipes)
          recipes.push(parseInfoboxRecipe('Regular', infoboxRecipe, map.idLookup))
      } else {
        throw new Error('Page doesn\'t have recipe');
      }

      // Applying recipes to items
      map.pages[potion.pageid].recipes ??= [];
      map.pages[potion.pageid].recipes.push(...recipes.filter(r => r));
    });
    return map;
  }, {idLookup: {}, items: {}, pages: {}});
  for (const fn of deferredInputs) fn();

  // Getting input items
  while (true) {
    const inputSlice = inputs.splice(0, 10);
    if (!inputSlice.length) break;

    const result = await client.query({
      titles: inputSlice.join('|'),
      format: 'json',
      prop: 'revisions|categories',
      formatversion: 2,
      rvprop: 'content',
      redirects: 1,
      rvslots: 'main',
      cllimit: 500,
    });
    await fixPages(client, result.query!.pages);

    for (const page of result.query!.pages as Page[]) {
      const wikiText = new client.Wikitext(page.revisions[0].slots.main.content);
      const templates = wikiText.parseTemplates({});
      const itemInfobox = templates.find(t => (t.name as string).toLowerCase?.() === 'infobox item')!;
      const items = parseInfoboxItem(client, itemInfobox) as (InfoboxItem & {
        pageName: string;
        pageId: number;
      })[];

      for (const item of items) {
        item.pageName = page.title;
        item.pageId = page.pageid;
        
        db.idLookup[item.name] = item.id;
        db.items[item.id] = item;
        db.pages[page.pageid] ??= {
          id: page.pageid,
          name: page.title,
          content: page.revisions[0].slots.main.content,
          categories: page.categories?.map(c => c.title) ?? [],
        };
      }
    }
  }

  for (const fn of deferredRecipes) await fn();

  fs.writeFileSync('src/data/herbloreItems.json', JSON.stringify(db, null, '  '));

  // Downloading images
  // for (const item of Object.values(db.items) as any[]) {
  //   const image = item.image;
  //   const url = new URL(item.image);

  //   await client.downloadFromUrl(image, `src/assets/potions/${url.pathname.split('/').slice(-1)}`);
  // }
})();


// interface Input {
//   readonly name: string,
//   readonly dosesOrQty: number,
//   readonly isSecondary: boolean,
// }

// interface Recipe {
//   readonly name: string,
//   readonly outputDosesOrQty: number,
//   readonly inputs: Input[],
//   readonly overrideDuplicateDoses?: number,
// }

// interface Potion {
//   readonly name: string;
//   readonly usesDoses: boolean;
//   readonly recipes: Recipe[];
//   readonly images: {
//     doseOrQty: number;
//     image: string;
//   }[];
// }

// const POTION_REGEX = /^(?<name>.+) \((?<doses>\d)\)/;
// const DOWNLOAD_IMAGES = false;

// const createPotion = async (client: Mwn, name: string, potions: Potion[]) => {
//   if (potions.find(p => p.name === name)) return;

//   const data = await client.query({
//     format: 'json',
//     prop: 'revisions',
//     rvprop: 'content',
//     rvslots: 'main',
//     titles: name,
//     formatversion: 2,
//     redirects: 1,
//   });

//   name = data.query!.pages[0].title;
//   if (potions.find(p => p.name === name)) return;

//   const text = data.query!.pages[0].revisions[0].slots.main.content;
//   const templates = client.Wikitext.parseTemplates(text, {recursive: true});
//   const switchInfobox = templates.find(t => (t.name as string).toLowerCase?.() === 'switch infobox');
//   let recipeInfoboxes = templates.filter(t => (t.name as string).toLowerCase?.() === 'infobox recipe');
//   const recipes: Recipe[] = [];
//   const images: Potion['images'] = [];

//   const infoboxItem = templates.find(t => (t.name as string).toLowerCase?.() === 'infobox item')!;
//   if (!infoboxItem.getValue('version1') && !infoboxItem.getValue('name')?.endsWith('(unf)')) return;

//   // Pushing early so potion discovery doesn't try to get the potion again
//   potions.push({name, usesDoses: !!infoboxItem.getValue('version1'), recipes, images});

//   // Reordering the recipes from the switch box so they line up with the names in the switchbox
//   if (recipeInfoboxes.length > 1 && switchInfobox) {
//     recipeInfoboxes = [];
//     for (let i = 1; switchInfobox.getValue(`item${i}`); i++) {
//       const templates = new client.Wikitext(switchInfobox.getValue(`item${i}`)!).parseTemplates({});
//       recipeInfoboxes.push(templates[0]);
//     }
//   }

//   // Downloading images
//   const itemInfobox = templates.find(t => (t.name as string).toLowerCase?.() === 'infobox item')!;
//   if (itemInfobox.getValue('image') && DOWNLOAD_IMAGES) {
//     const mwt = new client.Wikitext(infoboxItem.getValue('image')!);
//     mwt.parseLinks();
//     const file = mwt.files[0].target.title;
//     const filepath = `src/assets/potions/${file}`;

//     await client.download(`File:${file}`, filepath);

//     images.push({
//       doseOrQty: 1,
//       image: file,
//     });
//   } else if (DOWNLOAD_IMAGES) {
//     for (let i = 1; itemInfobox.getValue(`name${i}`); i++) {
//       const mwt = new client.Wikitext(infoboxItem.getValue(`image${i}`)!);
//       mwt.parseLinks();
//       const file = mwt.files[0].target.title;
//       const filepath = `src/assets/potions/${file}`;

//       await client.download(`File:${file}`, filepath);

//       images.push({
//         doseOrQty: i,
//         image: file,
//       });
//     }
//   }

//   for (let i = 0; i < recipeInfoboxes.length; i++) {
//     const recipeInfobox = recipeInfoboxes[i];
//     const name = switchInfobox?.getValue(`text${i+1}`) ?? 'Regular';
//     const inputs: Input[] = [];

//     // Skipping unfinished recipes
//     if (name.toLowerCase().includes('unfinished')) continue;

//     for (let m = 1; ; m++) {
//       let name = recipeInfobox.getValue(`mat${m}`);
//       let dosesOrQty = +(recipeInfobox.getValue(`mat${m}qty`) ?? '1');
//       if (!name) break;

//       let isPotion = false;

//       // Creating potion if material is potion
//       const match = name.match(POTION_REGEX);
//       if (match) {
//         if (match.groups!.doses === 'unf') {
//           await createPotion(client, name, potions)
//         } else {
//           name = match.groups!.name;
//           isPotion = true;
//           dosesOrQty *= +match.groups!.doses;
//           await createPotion(client, match.groups!.name, potions);
//         }
//       }

//       inputs.push({
//         name,
//         isSecondary: m > 1,
//         dosesOrQty,
//       });
//     }

//     const output = recipeInfobox.getValue(`output1`)!;
//     let qty = +(recipeInfobox.getValue(`output1qty`) ?? '1');
//     const match = output.match(POTION_REGEX);
//     if (match!.groups!.doses !== 'unf') {
//       qty *= +match!.groups!.doses;
//     }

//     recipes.push({
//       name,
//       outputDosesOrQty: qty,
//       inputs,
//       overrideDuplicateDoses: name.toLowerCase().includes('batch') ? +match?.groups!.doses! : undefined,
//     });
//   }
// }

// const potions: Potion[] = [];
// const document = new JSDOM(rawHtml.parse.text).window.document;
// const normalPotions = document.querySelector('#List_of_regular_potions')!.parentElement!.nextElementSibling!.querySelectorAll('.plinkt-link > a');
// const comboPotions = document.querySelector('#Combination_potions')!.parentElement!.nextElementSibling!.nextElementSibling!.nextElementSibling!.querySelectorAll('.plinkt-link > a');
// const potionLinks = [...normalPotions, ...comboPotions];

// for (const potionLink of potionLinks) {
//   const name = (potionLink as HTMLAnchorElement).textContent!;

//   try {
//     await createPotion(client, name, potions);
//   } catch (e) {
//     console.log(name);
//     throw e;
//   }
// }

// fs.writeFileSync('src/data/potions.json', JSON.stringify(potions, null, '  '));