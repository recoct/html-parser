import assert from 'assert'
import Path from 'path'
import HTMLTokenizer from './HTMLTokenizer.js'
import { OPEN_TAG_TOKEN, CLOSE_TAG_TOKEN, ATTRIBUTE_TOKEN, TEXT_TOKEN, COMMENT_TOKEN } from './HTMLTokenType.js'
import { ELEMENT_NODE, TEXT_NODE, COMMENT_NODE } from './HTMLNodeType.js'

const selfCloseTagRegExp = /^(?:meta|link|base|input|area|br|hr|img|source|embed|param|track|col|wbr)$/i
const isSelfCloseTag = tag => selfCloseTagRegExp.test(tag)

export default
class HTMLWalker {
  constructor(source = '') {
    this._tokens = []
    this._tokenizer = new HTMLTokenizer(source)
  }

  /** @public */
  append(source) {
    const tokenizer = this._tokenizer
    tokenizer.feed(source)
  }

  /** @public */
  *[Symbol.iterator]() {
    const tokenizer = this._tokenizer
    for (const token of tokenizer.resume()) {
      this.enqueue(token)
      if (tokenizer.stage === 'dispatch') {
        const node = this.commit()
        yield node
      }
    }
  }

  /** @private */
  enqueue(token) {
    const tokens = this._tokens
    tokens.push(token)
  }

  /** @private */
  commit() {
    const tokens = this._tokens
    const head = tokens.shift()
    const [ type, data ] = head
    assert(type !== ATTRIBUTE_TOKEN)

    let node = null
    if (type === OPEN_TAG_TOKEN) {
      node = fromOpenTag(data)
    } else
    if (type === CLOSE_TAG_TOKEN) {
      node = fromCloseTag(data)
    } else
    if (type === TEXT_TOKEN) {
      node = fromText(data)
    } else
    if (type === COMMENT_TOKEN) {
      node = fromComment(data)
    }
    assert(node)

    if (type === OPEN_TAG_TOKEN) {
      if (tokens.length > 0) {
        /* eslint-disable-next-line no-multi-assign */
        const attributes = node.attributes = {}

        while (tokens.length > 0) {
          const token = tokens.shift()
          /* eslint-disable-next-line no-shadow */
          const [ type, data ] = token
          assert(type === ATTRIBUTE_TOKEN)
          const [ key, value ] = data
          attributes[key] = value
        }
      }
    }
    assert(tokens.length === 0)

    return node
  }
}

export
class HTMLWalkerWithRoute extends HTMLWalker {
  constructor(source) {
    super(source)
    this._route = '/'
  }

  /** @public */
  *[Symbol.iterator]() {
    for (const node of super[Symbol.iterator]()) {
      const route = this.step(node)
      yield [ node, route ]
    }
  }

  /** @private */
  step(node) {
    let route = this._route
    const { open, close } = node
    if (open === close) {
      return route
    }

    const { tag } = node
    if (open) {
      route = Path.resolve(route, tag)
    } else {
      const tip = Path.basename(route)
      if (tag === tip) {
        route = Path.resolve(route, '..')
      }
    }

    this._route = route
    return route
  }
}

function fromOpenTag(tag) {
  return { type: ELEMENT_NODE, tag, attributes: null, open: true, close: isSelfCloseTag(tag) }
}

function fromCloseTag(tag) {
  return { type: ELEMENT_NODE, tag, close: true }
}

function fromText(data) {
  return { type: TEXT_NODE, data }
}

function fromComment(data) {
  return { type: COMMENT_NODE, data }
}
