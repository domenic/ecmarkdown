'use strict';
const assert = require('assert');
const Tokenizer = require('../dist/tokenizer.js').Tokenizer;
const Parser = require('../dist/parser.js').Parser;

describe('Parser', function () {
  function assertNode(node, name, location) {
    assert.equal(node.name, name);
    assert.deepEqual(node.location, location);
  }
  it('tracks positions', function () {
    const tokenizer = new Tokenizer('  1. [id="thing"] a\n  2. b c');
    const parser = new Parser(tokenizer);
    const algorithm = parser.parseAlgorithm();
    assertNode(algorithm, 'algorithm', {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 2, column: 9, offset: 28 },
    });
    const list = algorithm.contents;
    assertNode(list, 'ol', {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 2, column: 9, offset: 28 },
    });
    const item0 = list.contents[0];
    assertNode(item0, 'ordered-list-item', {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 2, column: 1, offset: 20 },
    });
    assertNode(item0.contents[0], 'text', {
      start: { line: 1, column: 19, offset: 18 },
      end: { line: 1, column: 20, offset: 19 },
    });
    const item1 = list.contents[1];
    assertNode(item1, 'ordered-list-item', {
      start: { line: 2, column: 1, offset: 20 },
      end: { line: 2, column: 9, offset: 28 },
    });
    assertNode(item1.contents[0], 'text', {
      start: { line: 2, column: 6, offset: 25 },
      end: { line: 2, column: 9, offset: 28 },
    });
  });
});
