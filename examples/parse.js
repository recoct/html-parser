import { inspect } from 'util'
import HTMLWalker from '../src/main/HTMLWalker.js'

inspect.defaultOptions.depth = 4

const walker = new HTMLWalker()
console.time('walker perf')
walker.append(createHTMLFragment1())
resumeWalker(walker)
console.log('append fragments')
walker.append(createHTMLFragment2())
resumeWalker(walker)
console.timeEnd('walker perf')

function resumeWalker(walker) {
  for (const node of iterateWithGuard(walker)) {
    console.log(node)
  }
}

function* iterateWithGuard(iterator, guard = 1000) {
  for (const item of iterator) {
    if (guard < 0) {
      break
    }
    guard -= 1
    yield item
  }
}

function createHTMLFragment1() {
  const html = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="https://www.w3.org/1999/xhtml">
    <head>
      <!--Required Headers-->
      <meta property="og:title" content="The Black Cat"/>
      <meta property="og:description" content="For the most wild, yet most homely narrative which I am about to pen, I neither expect nor solicit belief. Mad indeed would I be to expect it, in a case where my very senses reject their own evidence..."/>
      <meta property="og:type" content="novel"/>
      <meta property="og:novel:category" content="horror fiction"/>
      <meta property="og:novel:author" content="Edgar Allan Poe"/>
      <meta property="og:novel:book_name" content="The Black Cat"/>
      <meta property="og:novel:read_url" content="https://read.douban.com/reader/ebook/9532959/"/>
      <!--Optional Headers-->
      <meta property="og:url" content="https://read.douban.com/reader/ebook/9532959/"/>
      <meta property="og:novel:status" content="finished"/>
      <meta property="og:novel:author_link" content="https://en.wikipedia.org/wiki/Edgar_Allan_Poe"/>
      <meta property="og:novel:update_time" content='old-time' />
      <meta property="og:novel:latest_chapter_name" content="The Black Cat"/>
      <meta property="og:novel:latest_chapter_url" content="https://read.douban.com/reader/ebook/9532959/"/>
    </head>
    <body title="BODY">
      <a href="first.html">First</a>
      <a href="
  `
  return html
}

function createHTMLFragment2() {
  const html = `
      second.html" target="_blank">Second</a>
      <a href="third.html" target="_top" title="third">Third</a>
      <a href="fourth.html" target="_blank" title="fourth">
        <span>Fourth</span>
      </a>
      <a href="fifth.html" target="_blank" title="fifth">
        <img src="fifth.png">
      </a>
    </body>
  `
  return html
}
