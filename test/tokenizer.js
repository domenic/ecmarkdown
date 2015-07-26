'use strict';
const assert = require('assert');
const Tokenizer = require('../lib/tokenizer.js');
const formats = {
  star: '*',
  underscore: '_',
  tick: '`',
  pipe: '|',
  string: '"',
  tilde: '~'
};

function assertTok(tok, name, contents) {
  assert.equal(tok.name, name);
  assert.equal(tok.contents, contents);
}

describe('Tokenizer#peek', function () {
  let t;

  beforeEach(function () {
    t = new Tokenizer('a *b* c');
  });

  it('should return the next token', function () {
    assertTok(t.peek(), 'text', 'a');
  });

  it('should return later tokens when given an offset', function () {
    assertTok(t.peek(2), 'whitespace', ' ');
  });

  it('should not consume tokens', function () {
    assertTok(t.peek(2), 'whitespace', ' ');
    assertTok(t.peek(1), 'text', 'a');
  });

  it('should handle skipping buffering tokens', function () {
    assertTok(t.peek(2), 'whitespace', ' ');
    assertTok(t.peek(3), 'star', '*');
    assertTok(t.peek(), 'text', 'a');
  });

  it('should handle EOF properly', function () {
    assertTok(t.peek(7), 'text', 'c');
    assertTok(t.peek(8), 'EOF');
    assertTok(t.peek(9), 'EOF');
    assertTok(t.peek(10), 'EOF');
  });
});

describe('Tokenizer#next', function () {
  it('should handle EOF properly', function () {
    const t = new Tokenizer('a b');
    assertTok(t.next(), 'text', 'a');
    assertTok(t.next(), 'whitespace', ' ');
    assertTok(t.next(), 'text', 'b');
    assertTok(t.next(), 'EOF');
    assertTok(t.next(), 'EOF');
    assertTok(t.next(), 'EOF');
    assertTok(t.next(), 'EOF');
  });
});

function testBasicToken(name, token) {
  describe(name, function () {
    it('is scanned properly at the start', function () {
      const t = new Tokenizer(token + 'b');
      assertTok(t.next(), name, token);
      assertTok(t.next(), 'text', 'b');
      assertTok(t.next(), 'EOF');
    });

    it('is scanned properly after whitespace', function () {
      const t = new Tokenizer(' ' + token);
      assertTok(t.next(), 'whitespace', ' ');
      assertTok(t.next(), name, token);
      assertTok(t.next(), 'EOF');
    });

    it('is scanned properly after text', function () {
      const t = new Tokenizer('b' + token);
      assertTok(t.next(), 'text', 'b');
      assertTok(t.next(), name, token);
      assertTok(t.next(), 'EOF');
    });

    it('is scanned properly after linebreak', function () {
      const t = new Tokenizer('\n' + token);

      if (token === '\n') {
        assertTok(t.next(), 'parabreak', '\n\n');
      } else if (token === '\n\n') {
        assertTok(t.next(), 'parabreak', '\n\n');
        assertTok(t.next(), 'linebreak', '\n');
      } else {
        assertTok(t.next(), 'linebreak', '\n');
        assertTok(t.next(), name, token);
      }

      assertTok(t.next(), 'EOF');
    });

    it('is scanned properly after parabreak', function () {
      const t = new Tokenizer('\n\n' + token);
      assertTok(t.next(), 'parabreak', '\n\n');
      assertTok(t.next(), name, token);
      assertTok(t.next(), 'EOF');
    });
  });
}

describe('Token:', function () {
  Object.keys(formats).forEach(function (name) {
    testBasicToken(name, formats[name]);
  });
  testBasicToken('linebreak', '\n');
  testBasicToken('parabreak', '\n\n');

  describe('linebreak', function () {
    // TODO: Fix this
    it('does not consider \\r a linebreak', function () {
      const t = new Tokenizer('\r\nfoo');
      assertTok(t.next(), 'text', '\r');
      assertTok(t.next(), 'linebreak', '\n');
    });
  });

  describe('list', function () {
    it('considers a list at the start of the string a list', function () {
      const t = new Tokenizer('1. foo');
      assertTok(t.next(), 'list', '1. ');
      assertTok(t.next(), 'text', 'foo');
    });

    it('does not consider a list in the middle of the string a list', function () {
      const t = new Tokenizer('foo 1. foo');
      assertTok(t.next(), 'text', 'foo');
      assertTok(t.next(), 'whitespace', ' ');
      assertTok(t.next(), 'text', '1.');
      assertTok(t.next(), 'whitespace', ' ');
      assertTok(t.next(), 'text', 'foo');
    });

    // note that this will not parse as a list but the lexer considers it one
    // since it doesn't know if we're in a paragraph or a list.
    it('considers a list after a newline a list', function () {
      const t = new Tokenizer('foo\n1. foo');
      assertTok(t.next(), 'text', 'foo');
      assertTok(t.next(), 'linebreak', '\n');
      assertTok(t.next(), 'list', '1. ');
      assertTok(t.next(), 'text', 'foo');
    });

    it('does not consider a number without a dot a list', function () {
      const t = new Tokenizer('1 foo');
      assertTok(t.next(), 'text', '1');
      assertTok(t.next(), 'whitespace', ' ');
      assertTok(t.next(), 'text', 'foo');
    });

    it('does not consider a number and a dot without a trailing space a list', function () {
      const t = new Tokenizer('1.foo');
      assertTok(t.next(), 'text', '1.foo');
    });

    it('handles preceding whitespace', function () {
      const t = new Tokenizer(' \t 1. foo');
      assertTok(t.next(), 'list', ' \t 1. ');
      assertTok(t.next(), 'text', 'foo');
    });
  });

  describe('HTML comments', function () {

    // this appears to be a deviation from GMD but seems like a good idea.
    it('allows linebreaks', function () {
      const t = new Tokenizer('<!--\n-->foo');
      assertTok(t.next(), 'comment', '<!--\n-->');
      assertTok(t.next(), 'text', 'foo');
    });

    it('can follow characters', function () {
      const t = new Tokenizer('foo<!--\n-->foo');
      assertTok(t.next(), 'text', 'foo');
      assertTok(t.next(), 'comment', '<!--\n-->');
      assertTok(t.next(), 'text', 'foo');
    });

    it('need the closing tag', function () {
      const t = new Tokenizer('foo<!-- --foo');
      assertTok(t.next(), 'text', 'foo<!--');
      assertTok(t.next(), 'whitespace', ' ');
      assertTok(t.next(), 'text', '--foo');
    });
  });

  describe('HTML tags', function () {

    // this appears to be a deviation from GMD but seems like a good idea.
    it('allows linebreaks', function () {
      const t = new Tokenizer('<p\n>foo</p>');
      assertTok(t.next(), 'tag', '<p\n>');
      assertTok(t.next(), 'text', 'foo');
      assertTok(t.next(), 'tag', '</p>');
    });

    it('can follow characters', function () {
      const t = new Tokenizer('foo<br>foo');
      assertTok(t.next(), 'text', 'foo');
      assertTok(t.next(), 'tag', '<br>');
      assertTok(t.next(), 'text', 'foo');
    });

    it('need the closing angle bracket', function () {
      const t = new Tokenizer('foo<br foo');
      assertTok(t.next(), 'text', 'foo<br');
      assertTok(t.next(), 'whitespace', ' ');
      assertTok(t.next(), 'text', 'foo');

      const t2 = new Tokenizer('<br foo');
      assertTok(t2.next(), 'text', '<br');
      assertTok(t2.next(), 'whitespace', ' ');
      assertTok(t2.next(), 'text', 'foo');
    });

  });
});

function testEscapeFormat(name, token) {
  it('escapes start ' + name, function () {
    const t = new Tokenizer('\\' + token + 'a' + token);
    assertTok(t.next(), 'text', token + 'a');
    assertTok(t.next(), name, token);
    assertTok(t.next(), 'EOF');
  });

  it('escapes end ' + name, function () {
    const t = new Tokenizer(token + 'a\\' + token);
    assertTok(t.next(), name, token);
    assertTok(t.next(), 'text', 'a' + token);
    assertTok(t.next(), 'EOF');
  });
}

describe('backslash escapes', function () {
  it('considers one backslash text', function () {
    const t = new Tokenizer('\\');
    assertTok(t.next(), 'text', '\\');
    assertTok(t.next(), 'EOF');
  });

  it('considers trailing backslash text', function () {
    const t = new Tokenizer('a\\');
    assertTok(t.next(), 'text', 'a\\');
    assertTok(t.next(), 'EOF');
  });

  it('considers two backslashes a backslash', function () {
    const t = new Tokenizer('\\\\a');
    assertTok(t.next(), 'text', '\\a');
    assertTok(t.next(), 'EOF');
  });

  Object.keys(formats).forEach(function (name) {
    testEscapeFormat(name, formats[name]);
  });

  it('escapes html tags', function () {
    const t = new Tokenizer('\\<div>hello</div>');
    assertTok(t.next(), 'text', '<div>hello');
    assertTok(t.next(), 'tag', '</div>');
    assertTok(t.next(), 'EOF');
  });

  it('escapes html comments', function () {
    const t = new Tokenizer('\\<!--hello-->');
    assertTok(t.next(), 'text', '<!--hello-->');
    assertTok(t.next(), 'EOF');
  });

  it('does not escape non-format characters', function () {
    const t = new Tokenizer('\\a');
    assertTok(t.next(), 'text', '\\a');
    assertTok(t.next(), 'EOF');
  });
});
