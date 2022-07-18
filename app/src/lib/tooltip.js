import * as d3 from 'd3'

const px = x => `${x}px`

export class Tooltip {
  constructor (html) {
    this.width = 100
    this.html = html
    this.el = d3.select(document.createElement('div'))
      .attr('class', 'fpe-tooltip')
      .style('top', '0')
      .style('left', '0')
      .style('opacity', '0')
    document.body.appendChild(this.el.node())
  }

  destroy (d) {
    this.el.remove()
  }

  show (event, d) {
    this.el
      .style('top', px(event.pageY - 100))
      .style('left', px(event.pageX + 10))
      .style('opacity', '1')
      .html(this.html(d))
  }

  hide () {
    this.el.style('opacity', '0')
  }
}
