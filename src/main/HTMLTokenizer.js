import assert from 'assert'
import { HTMLDispatchTokenScanner, HTMLTagTokenScanner, HTMLAttributeTokenScanner, HTMLTextTokenScanner, HTMLCommentTokenScanner } from './HTMLTokenScanner.js'

export default
class HTMLTokenizer {
  constructor() {
    this._source = ''
    this._token = null
    this._currStage = 'dispatch'
    this._prevStage = null
    this._interrupted = true
    this._scanners = {
      dispatch: new HTMLDispatchTokenScanner(this),
      element: new HTMLTagTokenScanner(this),
      attribute: new HTMLAttributeTokenScanner(this),
      text: new HTMLTextTokenScanner(this),
      comment: new HTMLCommentTokenScanner(this),
    }
  }

  /** @param {string} source */
  feed(source) {
    assert(typeof source === 'string')
    const moreData = source.length > 0
    if (moreData) {
      this._source += source
      this._interrupted = false
    }
  }

  get stage() {
    return this._currStage
  }

  *resume() {
    do {
      if (this._interrupted) {
        return
      }

      const scanners = this._scanners
      const curr = scanners[this._currStage]
      if (!curr) {
        this._interrupted = true
        this._currStage = this._prevStage
        return
      }

      const prev = scanners[this._prevStage]
      if (prev) {
        curr.lastIndex = prev.lastIndex
      }

      curr.scan(this._source)

      if (this._token) {
        yield this._token
      }
      this._token = null
    } while (true)
  }

  /**
   * @param {string} stage next stage
   * @param {object} token next token
   */
  emit(stage, token = null) {
    if (this._interrupted) {
      return
    }

    this._token = token
    this._prevStage = this._currStage
    this._currStage = stage
  }
}
