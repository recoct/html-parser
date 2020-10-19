import assert from 'assert'
import { OPEN_TAG_TOKEN, CLOSE_TAG_TOKEN, ATTRIBUTE_TOKEN, TEXT_TOKEN, COMMENT_TOKEN } from './HTMLTokenType.js'

class HTMLTokenScanner {
  constructor(coordinator) {
    this._coordinator = coordinator
  }

  get coordinator() {
    return this._coordinator
  }

  get lastIndex() {
    return this.scanner.lastIndex
  }

  set lastIndex(index) {
    this.scanner.lastIndex = index
  }

  exec(source) {
    const { scanner } = this
    const { lastIndex } = scanner
    const match = scanner.exec(source)
    if (!match) {
      scanner.lastIndex = lastIndex
      return null
    }

    return match
  }

  /* eslint-disable-next-line class-methods-use-this, no-unused-vars */
  scan(source) {
    throw new Error('not implemented')
  }
}

export
class HTMLDispatchTokenScanner extends HTMLTokenScanner {
  // [ _, groups: { isElement, isComment, isText } ]
  scanner = /\s*(?!<?$)(?=(?<isElement><[/]?[a-z]|<[/]>)|(?<isComment><[/?!])|(?<isText>[^\s]))/isy

  scan(source) {
    const { coordinator } = this
    const match = super.exec(source)
    if (!match) {
      coordinator.emit('interrupted')
      return
    }

    const { isElement, isText, isComment } = match.groups
    if (isElement) {
      coordinator.emit('element')
    } else
    if (isText) {
      coordinator.emit('text')
    } else
    if (isComment) {
      coordinator.emit('comment')
    } else {
      assert(false, 'never')
    }
  }
}

export
class HTMLTagTokenScanner extends HTMLTokenScanner {
  // [ _, groups: { openTagName, closeTagName, noAttributes } ]
  scanner = /(?:<(?<openTagName>[a-z][^>\s/]*)(?:>|[\s/]+>?)|<\/(?:>|(?<closeTagName>[a-z][^>\s/]*)(?:>|[\s/][^>]*>)))(?<=(?<noAttributes>>)?)/isy

  scan(source) {
    const { coordinator } = this
    const match = super.exec(source)
    if (!match) {
      coordinator.emit('interrupted')
      return
    }

    let { openTagName, closeTagName } = match.groups
    let token = null
    if (openTagName) {
      openTagName = openTagName.toLowerCase()
      token = [ OPEN_TAG_TOKEN, openTagName ]
    } else
    if (closeTagName) {
      closeTagName = closeTagName.toLowerCase()
      token = [ CLOSE_TAG_TOKEN, closeTagName ]
    } else {
      assert(false, 'never')
    }

    const { noAttributes } = match.groups
    if (noAttributes) {
      coordinator.emit('dispatch', token)
    } else {
      coordinator.emit('attribute', token)
    }
  }
}

export
class HTMLAttributeTokenScanner extends HTMLTokenScanner {
  // [ _, groups: { attrKey, attrValue, terminated } ]
  scanner = /[\s/]*(?:>|(?<attrKey>[^>\s/][^>\s=/]*(?=[>\s/=]))\s*(?:(?=[^=])|(?:=\s*(?:(?=>)|\/|(?<attrValue>"[^"]*"|'[^']*'|[^"'][^>\s/]*(?=[>\s/])))))[\s/]*(?<terminated>>)?)/isy

  scan(source) {
    const { coordinator } = this
    const match = super.exec(source)
    if (!match) {
      coordinator.emit('interrupted')
      return
    }

    /* eslint-disable-next-line prefer-const */
    let { attrKey, attrValue } = match.groups
    assert(attrKey)
    attrValue = attrValue.replace(/^["']|["']$/g, '')
    const token = [ ATTRIBUTE_TOKEN, [ attrKey, attrValue ] ]

    const { terminated } = match.groups
    if (terminated) {
      coordinator.emit('dispatch', token)
    } else {
      coordinator.emit('attribute', token)
    }
  }
}

export
class HTMLTextTokenScanner extends HTMLTokenScanner {
  scanner = /(?:(?!<(?:[a-z/?!]|$)).)+/isy

  scan(source) {
    const { coordinator } = this
    const match = super.exec(source)
    if (!match) {
      coordinator.emit('interrupted')
      return
    }

    const [ data ] = match
    const token = [ TEXT_TOKEN, data ]
    coordinator.emit('dispatch', token)
  }
}

export
class HTMLCommentTokenScanner extends HTMLTokenScanner {
  scanner = /<[/?!][^>]*>/isy

  scan(source) {
    const { coordinator } = this
    const match = super.exec(source)
    if (!match) {
      coordinator.emit('interrupted')
      return
    }

    const [ data ] = match
    const token = [ COMMENT_TOKEN, data ]
    coordinator.emit('dispatch', token)
  }
}
