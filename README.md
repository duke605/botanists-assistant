# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.app.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

```mermaid
erDiagram
  Page ||--|{ Item : ""
  Page ||--o{ Recipe : ""
  Recipe ||--|| Output : ""
  Recipe ||--|{ Input : ""
  Output }o--|| Item : ""
  Input }o--|| Item : ""

  Item {
    number id PK
    string name UK
    string update
    string release
    number weight
    string examime
    string tradable
    boolean noteable
    boolean equipable
    boolean stackable
    boolean quest
    boolean members
    boolean isDefault
    string image
    string pageName
    number pageId FK
    number doses "NULL"
    number relatedItemIds "NULL"
    string[] version "NULL"
  }

  Page {
    number id PK
    string name UK
    string content
    string[] categories
  }

  Recipe {
    string name
    number exp
    number[] ticks
    number[] herbLevel
  }

  Output {
    number itemId FK
    number quantity
  }

  Input {
    number itemId FK
    number quantity
    boolean isSecondary
  }
```