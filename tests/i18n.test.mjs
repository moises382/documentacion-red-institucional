import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../app/i18n.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile(
  'i18n.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let keys = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'translations') {
    keys = node.initializer.properties.map((property) => property.name.text);
  }
  ts.forEachChild(node, visit);
}
visit(ast);

test('los catálogos alemán, chino y francés cubren los textos de la interfaz', () => {
  assert.ok(keys.length > 450);
  for (const locale of ['de', 'zh', 'fr']) {
    const catalog = JSON.parse(
      readFileSync(new URL(`../app/locales/${locale}.json`, import.meta.url), 'utf8'),
    );
    assert.deepEqual(
      Object.keys(catalog).sort(),
      [...keys].sort(),
      `${locale}: faltan o sobran textos`,
    );
    for (const [key, value] of Object.entries(catalog)) {
      assert.equal(typeof value, 'string', `${locale}: ${key}`);
      assert.ok(value.trim(), `${locale}: ${key} está vacío`);
      assert.ok(!value.includes('__LOCALE_SPLIT_'), `${locale}: ${key} conserva un separador`);
    }
  }
});
