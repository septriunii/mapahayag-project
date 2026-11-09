// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

it.each([
  ['index.html', 'da290b1b74c394f645e77916ad9249b22b1cb46adc16fda68e965b6dd3c46008'],
  ['index-no-nir.html', '64b969cb3602f0477167b1bab7583a3f2aebd47c06aa48435aa27766f1895975'],
])('preserves the archived legacy page %s', (name, expected) => {
  const source = readFileSync(`../legacy/${name}`, 'utf8').replace(/\r\n/g, '\n');
  expect(createHash('sha256').update(source).digest('hex')).toBe(expected);
});
