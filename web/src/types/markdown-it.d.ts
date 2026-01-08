declare module 'markdown-it' {
  const MarkdownIt: new (options?: {
    linkify?: boolean
    highlight?: (str: string, lang?: string) => string
  }) => {
    render: (content: string) => string
  }
  export default MarkdownIt
}
