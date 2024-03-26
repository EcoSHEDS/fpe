<template>
  <div>
    <highcharts constructor-type="stockChart" :options="chartOptions" ref="chart"></highcharts>
  </div>
</template>

<script>
import { variables } from '@/lib/constants'
import { format } from 'd3-format'
import { DateTime } from 'luxon'
// import Highcharts from 'highcharts'
// const COLORS = Highcharts.getOptions().colors

const COLORS = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf'
]

const variableAxes = variables.map((variable, i) => {
  return {
    id: variable.id,
    title: {
      text: variable.id
    },
    top: '25%',
    height: '75%',
    alignTicks: true,
    startOnTick: true,
    endOnTick: true,
    type: variable?.axis?.type || 'linear',
    labels: {
      y: 4
    }
  }
})
variableAxes.push({
  id: 'SCORE',
  title: {
    text: 'MODEL SCORE'
  },
  top: '25%',
  height: '75%',
  alignTicks: true,
  startOnTick: true,
  endOnTick: true,
  type: 'linear',
  labels: {
    y: 4
  }
})

export default {
  name: 'SubdailyTimeseriesChart',
  props: ['loading', 'series', 'images', 'station', 'image', 'date'],
  data () {
    return {
      chartOptions: {
        chart: {
          animation: false,
          height: '275px',
          zooming: {
            mouseWheel: {
              enabled: false
            }
          }
        },
        noData: {
          style: {
            fontWeight: 'bold',
            fontSize: '15px',
            color: '#303030'
          }
        },
        plotOptions: {
          series: {
            animation: false,
            turboThreshold: 0
          }
        },
        legend: {
          enabled: true
        },
        tooltip: {
          animation: false,
          headerFormat: '',
          outside: true,
          shared: true
        },
        navigator: {
          enabled: false
        },
        rangeSelector: {
          enabled: false
        },
        scrollbar: {
          enabled: false
        },
        xAxis: {
          ordinal: false
        }
      }
    }
  },
  watch: {
    series () {
      this.updateChart()
    },
    image () {
      this.highlightImage(this.image)
    }
  },
  async mounted () {
    this.chart = this.$refs.chart.chart
    this.chart.container.onmouseout = () => {
      this.highlightImage(this.image)
    }
    await this.updateChart()
  },
  beforeDestroy () {
    this.chart.container.onmouseout = null
  },
  methods: {
    updateChart () {
      // console.log('updateChart')
      const seriesVariableIds = this.series.map(d => d.variableId)
      const dataAxes = variableAxes.filter(d => seriesVariableIds.includes(d.id))
      dataAxes.forEach((axis, i) => {
        axis.opposite = i > 0
        axis.gridLineWidth = i > 0 ? 0 : 1
      })

      const yAxes = [
        {
          id: 'images',
          title: {
            text: null
          },
          labels: {
            enabled: false
          },
          opposite: false,
          endOnTick: false,
          height: '15%'
        },
        ...dataAxes
      ]
      const images = this.images.map(d => {
        return { x: d.timestamp.valueOf(), y: 0, image: d }
      })
      const timezone = this.station.timezone
      const that = this
      const imagesSeries = {
        name: 'Photo',
        data: images,
        yAxis: 'images',
        showInLegend: false,
        lineWidth: 0,
        marker: {
          enabled: true,
          symbol: 'circle',
          radius: 5,
          lineColor: 'goldenrod',
          lineWidth: 1,
          fillColor: 'white',
          states: {
            normal: {
              opacity: 1
            },
            hover: {
              radiusPlus: 5,
              opacity: 1
            }
          }
        },
        color: 'goldenrod',
        tooltip: {
          pointFormatter: function () {
            const timestamp = DateTime.fromJSDate(this.image.timestamp).setZone(timezone).toFormat('DD ttt')
            that.$emit('hover', this.image)
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${timestamp}</b><br/>`
          },
          xDateFormat: '%b %e, %Y'
        }
      }

      const variableSeries = this.series.map((series, i) => {
        const seriesValues = series.data.map(d => {
          return {
            x: d.timestamp.valueOf(),
            y: d.value
          }
        })
        const lineSeries = {
          name: series.name,
          source: series.source,
          variableId: series.variableId,
          data: seriesValues,
          yAxis: series.variableId,
          gapSize: 60 * 60 * 1000, // 1 hour
          gapUnit: 'value',
          legend: {
            enabled: true
          },
          color: COLORS[i],
          marker: {
            enabled: false
          },
          enableMouseTracking: false,
          states: {
            hover: {
              halo: {
                size: 0
              }
            },
            inactive: {
              opacity: 1
            }
          }
        }
        const imageValues = this.images.map(d => {
          const value = d.values.find(v => v.name === series.name)
          return {
            x: d.timestamp.valueOf(),
            y: value !== undefined ? value.value : null,
            image: d
          }
        })
        const markerSeries = {
          name: series.name,
          linkedTo: ':previous',
          source: series.source,
          variableId: series.variableId,
          data: imageValues,
          yAxis: series.variableId,
          color: COLORS[i],
          lineWidth: 0,
          marker: {
            enabled: true,
            symbol: 'circle',
            radius: 1,
            states: {
              normal: {
                opacity: 1
              },
              hover: {
                radiusPlus: 6,
                opacity: 1
              }
            }
          },
          tooltip: {},
          states: {
            hover: {
              lineWidthPlus: 0
            },
            inactive: {
              opacity: 1
            }
          }
        }

        markerSeries.tooltip.pointFormatter = function () {
          return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${format('.1f')(this.y)}</b><br/>`
        }

        return [lineSeries, markerSeries]
      }).flat()

      const newSeries = [imagesSeries, ...variableSeries]

      // date axis range
      const start = this.$luxon.DateTime.fromISO(this.date, { zone: this.station.timezone }).startOf('day')
      const end = start.plus({ days: 1 })

      // first clear out chart to reset series and yAxes
      // in case the set of series (variables) has changed
      this.chart.update({
        yAxis: [],
        series: []
      }, false, true, false)
      this.chart.update({
        time: {
          timezone
        },
        xAxis: {
          min: start.valueOf(),
          max: end.valueOf()
        },
        yAxis: yAxes,
        series: newSeries
      }, true, true, false)

      if (this.image) {
        this.highlightImage(this.image)
      }

      if (this.series.length === 0) {
        this.chart.showNoData()
      } else {
        this.chart.hideNoData()
      }
    },
    highlightImage () {
      // console.log('highlightImage', image)
      if (!this.chart) return
      if (this.chart.hoverPoints !== undefined && this.chart.hoverPoints !== null) {
        // user is mousing over chart
        this.chart.series.forEach(s => {
          if (!s.options.marker.enabled) return
          s.points.forEach(p => {
            if (!this.chart.hoverPoints.includes(p) && p.state === 'hover') {
              p.setState('')
            }
          })
        })
      } else {
        // highlight is triggered by parent (next/prev, play)
        this.chart.series.forEach(s => {
          if (!s.options.marker.enabled) return
          // console.log(s.name)
          s.points.forEach(p => {
            // console.log(p.image)
            p.setState('')
            if (p.image && this.image && p.image.id === this.image.id) {
              if (p.state !== 'hover') {
                p.setState('hover')
              }
              if (s.name !== 'Photo' && s.name !== 'Navigator 1' && p.graphic) {
                p.graphic.toFront()
              }
            }
          })
        })
      }
    }
  }
}
</script>
