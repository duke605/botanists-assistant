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
  version?: string;
  tradable: 'YES' | 'NO' | 'RESTRICTED';
  release: string;
  weight: number;
  examine: string;
  members: boolean;
  equipable: boolean;
  stackable: boolean;
  removal?: string;
  flask?: true;
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
  try {
    for (const v of versions) {
      const imageWikiText = new client.Wikitext(getVersionedParam(v, 'image')!);
      imageWikiText.parseLinks();
      const item = {
        flask: tmpl.getValue('flask') === 'yes' || undefined,
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
        image: `https://runescape.wiki/images/${imageWikiText.files[0].target.getMain()}`,
      };

      const required = ['id', 'name', 'update', 'release', 'weight', 'examine', 'tradable', 'noteable', 'equipable', 'stackable', 'quest', 'members', 'image'];
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
  if (page.title.match(/\(\d\) \(unf\)$/)) return false;
  if (!page.categories?.some(c => c.title === 'Category:Items')) return false; 
  if (page.categories?.some(c =>
    c.title === 'Category:Quest items' ||
    c.title === 'Category:Permanently discontinued items' ||
    c.title === 'Category:Items that have never been re-released' ||
    c.title === 'Category:Items that may not be currently obtainable' ||
    c.title === 'Category:Minigame items'
  )) return false;
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

  const allPotionPages: Page[] = [];
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
    
    allPotionPages.push(...potions);
  } while (cont);

  // Getting flasks
  const flaskPages = [] as {title: string, page: Page}[];
  for (const page of allPotionPages) {
    const otherUsePotionTemplate = new client.Wikitext(page.revisions[0].slots.main.content).parseTemplates({namePredicate: (name) => name.toLowerCase() === 'oupotion'})[0];
    if (!otherUsePotionTemplate) continue;

    flaskPages.push({
      title: otherUsePotionTemplate.getValue('flask') ?? (page.title.replace(/[Pp]otion$/, '').trim() + ' flask'),
      page,
    });
  }

  while (flaskPages.length > 0) {
    const slice = flaskPages.splice(0, 10);
    const result = await client.query({
      format: 'json',
      prop: 'revisions|categories',
      titles: slice.map(s => s.title).join('|'),
      cllimit: 500,
      formatversion: 2,
      rvprop: 'content',
      rvslots: 'main',
    });
    const pages = result.query!.pages as Page[];

    for (const flaskPage of pages) {
      const unnormalizedName = result.query!.normalized?.find(n => n.to === flaskPage.title)?.from ?? flaskPage.title;
      const potionPage = slice.find(p => p.title === unnormalizedName)!;
      const infoboxItemTemplate = new client.Wikitext(flaskPage.revisions[0].slots.main.content).parseTemplates({namePredicate: (name) => name.toLowerCase() === 'infobox item'})[0]!;

      infoboxItemTemplate.addParam('flask', 'yes', '|flask = yes');

      potionPage.page.revisions[0].slots.main.content += templateToString(infoboxItemTemplate);
    }
  }

  const inputs = [] as string[];
  const deferredInputs: Function[] = [];
  const deferredRecipes: Function[] = [];
  const db = allPotionPages.reduce((map, potion) => {
    let content = potion.revisions[0].slots.main.content

    const wikiText = new client.Wikitext(content);
    const templates = wikiText.parseTemplates({recursive: true});
    const infoboxItemTemplates = templates.filter(t => (t.name as string).toLowerCase?.() === 'infobox item')
    const items = infoboxItemTemplates.flatMap(t => parseInfoboxItem(client, t)) as (InfoboxItem & {
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

        // Ignoring unfinished potions
        if (recipe.getParam('facility')) continue;

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

  fs.writeFileSync('src/data/herbloreItems.json', JSON.stringify({
    items: Object.values(db.items),
    pages: Object.values(db.pages),
  }, null, '  '));
})();