/** Minimal Lexical root for Payload richText `body` seeds (trust pages, placeholders). */
export function emptyLexicalDocument(): { root: Record<string, unknown> } {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [],
        },
      ],
    },
  }
}
