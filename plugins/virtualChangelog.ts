import path from 'node:path';
import fs from 'node:fs';
import { Plugin } from 'vite';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import * as YAML from 'yaml';

dayjs.extend(customParseFormat);

export default (): Plugin => {
  const name = 'virtual-changelog';
  const pluginId = 'virtual:changelog';
  const resolvedPluginId = `\0${pluginId}`;
  const changelogPath = path.resolve(__dirname, '../docs/changelog.yml');

  return {
    name,
    resolveId(id) {
      if (id === pluginId) return resolvedPluginId;
    },
    load(id) {
      if (id !== resolvedPluginId) return;
      const data = fs.readFileSync(changelogPath);
      const code = Object.entries(YAML.parse(data.toString())).map(([ date, changes ]) =>
        `{date: dayjs(${dayjs(date, 'YYYY-MM-DD').unix() * 1000}), changes: ${JSON.stringify(changes)}}`
      ).join(',\n  ')

      return `import dayjs from 'dayjs';export default [${code}];`;
    },
  }
};