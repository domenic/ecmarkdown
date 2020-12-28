# Ecmarkdown

**Ecmarkdown** is a Markdown-inspired syntax for writing text and algorithms in the style of [the ECMAScript spec](https://tc39.github.io/ecma262/). This package will convert Ecmarkdown input to HTML output.

## Examples

### An algorithm

Some of Ecmarkdown's biggest benefits are when using it to write algorithm steps, without the many formalities HTML requires for list items and inline formatting of common algorithmic constructs.

```
1. Assert: Type(_iterator_) is Object.
1. Assert: _completion_ is a Completion Record.
1. Let _hasReturn_ be HasProperty(_iterator_, `"return"`).
1. ReturnIfAbrupt(_hasReturn_).
  1. If _hasReturn_ is *true*, then
    1. Let _innerResult_ be Invoke(_iterator_, `"return"`, ( )).
    1. If _completion_.[[type]] is not ~throw~ and _innerResult_.[[type]] is ~throw~, then
      1. Return _innerResult_.
1. Return _completion_.
```

will be converted to

```html
<emu-alg>
  <ol>
    <li>Assert: Type(<var>iterator</var>) is Object.</li>
    <li>Assert: <var>completion</var> is a Completion Record.</li>
    <li>Let <var>hasReturn</var> be HasProperty(<var>iterator</var>, <code>"return"</code>).</li>
    <li>ReturnIfAbrupt(<var>hasReturn</var>).
      <ol>
        <li>If <var>hasReturn</var> is <emu-val>true</emu-val>, then
          <ol>
            <li>Let <var>innerResult</var> be Invoke(<var>iterator</var>, <code>"return"</code>, ( )).</li>
            <li>If <var>completion</var>.[[type]] is not <emu-const>throw</emu-const> and <var>innerResult</var>.[[type]] is <emu-const>throw</emu-const>, then
              <ol>
                <li>Return <var>innerResult</var>.</li>
              </ol>
            </li>
          </ol>
        </li>
      </ol>
    </li>
    <li>Return <var>completion</var>.</li>
  </ol>
</emu-alg>
```

## Syntax

#### Lists

Lists are written as a series of lines, each starting with either a number, e.g. `1.`, or a star, e.g. `*`. Inside a list item line you can use inline Ecmarkdown constructs. The first list item's number determines the starting number in the output (via `<ol start="x">`); subsequent list items' numbers are ignored.

Lists can be nested. To do so, use any number of spaces to indent; as long as the number of spaces is consistent, list items will stay together in a nested list.

List items can be given a id by putting `[id="something"]` at the start of the item, as in `1. [id="something"]`. This will generate a `<li>` element with an id property of `something`. This is used by Ecmarkup for referencing specific steps of Ecmarkdown algorithms.

#### HTML Blocks

Any line which starts with a block-level HTML tag ([as defined by CommonMark](http://spec.commonmark.org/0.22/#html-blocks), with the addition of `<emu-note>`, `<emu-clause>`, `<emu-intro>`, `<emu-annex>`, `<emu-biblio>`, `<emu-import>`, `<emu-table>`, `<emu-figure>`, `<emu-example>`, `<emu-alg>`, and `<emu-see-also-para>`) is a HTML block line. Ecmarkdown cannot be used on the line starting a HTML block, but subsequent lines before the closing tag do allow it.

#### Opaque HTML Blocks

The tags `<emu-grammar>`, `<emu-eqn>`, `<emu-production>`, `<pre>`, `<code>`, `<script>`, and `<style>` are considered opaque. Their entire contents, until their closing tag is seen, are left alone, with no Ecmarkdown processing or HTML escaping. As with ordinary HTML blocks, this only applies if the tag begins the line; if they are seen mid-line they will be treated as inline HTML.

### Inline Formatting

Inside a paragraph, list item, or header, the following inline formatting elements can appear:

**Variables** are written as `_x_` and are translated to `<var>x</var>`. Variables cannot contain whitespace or other formatting characters.

**Values** are written as `*x*` and are translated to `<emu-val>x</emu-val>`. Values cannot contain asterisks.

**Code** is written as `` `x` `` and is translated to `<code>x</code>`. Code cannot contain backticks.

**Spec-level constants** are written as `~x~` and are translated to `<emu-const>x</emu-const>`. Spec-level constants cannot contain tildes.

**Nonterminals** are written as `|x|`, `|x?|`, `|x[p]|`, or `|x[p]?|`. These are translated, respectively, into `<emu-nt>x</emu-nt>`, `<emu-nt optional>x</emu-nt>`, `<emu-nt params="p">x</emu-nt>`, or `<emu-nt params="p" optional>x</emu-nt>`. Nonterminal names can only be composed of letters and numbers. Params can be composed of anything except a closing square bracket. It's possible to write `_opt` instead of `?`, e.g.: `|x_opt|` instead of `|x?|` and `|x[p]_opt|` instead of `|x[p]?|`.

All formats can be started following non-alphanumeric and non-whitespace characters and can be ended following any non-whitespace character. The one exception is code formats which can begin and end in any context.  For example, `my_SIMD_constructor` does not contain any variables while `_SIMD_Constructor` does.

You can escape any format above with a backslash. Escaping of any non-format characters will not be considered an escape and will render literally (eg. `\a` simply renders as `\a`). If you need a literal backslash before a formatting character, you must escape the backslash (eg. `\\*foo*` renders as `\<emu-val>foo</emu-val>`).

HTML tags used inside paragraphs will generally be passed through, with their contents processed further by Ecmarkdown (but not their attribute values). The exception is if the tag starts the line and is categorized as block or opaque, in which case the previous sections apply.

## Interaction with Ecmarkup

Ecmarkdown is meant to be used together with [Ecmarkup](https://github.com/bterlson/ecmarkup/). Ecmarkup provides:

* The framework for structuring and compiling a specification containing Ecmarkdown contents
* An auto-linking postprocessing step
* A target vocabulary (the `<emu-` tags) for some Ecmarkdown constructs.

In short, we expect Ecmarkdown to be embedded within a larger Ecmarkup document, used for writing algorithm steps and other text in a concise format.
