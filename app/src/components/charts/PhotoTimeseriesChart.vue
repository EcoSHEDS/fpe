<template>
  <div>
    <div class="d-flex px-8 py-4 align-center">
      <div class="text-body-2">
        <span style="vertical-align: middle;">Mode: <b>{{ mode === 'DAY' ? 'Daily Mean' : 'Sub-daily' }}</b></span>
        <v-tooltip bottom max-width="400">
          <template v-slot:activator="{ on }">
            <v-btn
              small
              icon
              v-on="on"
              color="default"
              class="ml-2"
            ><v-icon small>mdi-information</v-icon></v-btn>
          </template>
          <div class="mb-2">When the selected time period is more than 30 days, the chart is in <b>Daily Mean</b> mode and each timeseries is aggregated to daily values. Only the photo taken closest to noon on each date will be shown.</div>
          <div>Otherwise, the <b>Sub-daily</b> values of each variable along with all available photos will be shown.</div>
        </v-tooltip>
      </div>
      <v-divider vertical class="mx-4"></v-divider>
      <v-checkbox
        :value="scaleValues"
        color="default"
        hide-details
        class="mt-0 pt-0"
        @change="$emit('update:scaleValues', !scaleValues)"
      >
        <template v-slot:label>
          <div class="text-body-2 black--text">Show as Rank Percentile (0-100%)</div>
        </template>
      </v-checkbox>
      <v-spacer></v-spacer>
      <div class="d-flex align-center">
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn
              small
              depressed
              v-on="on"
              color="default"
              class="ml-2"
            >About This Chart <v-icon right small>mdi-menu-down</v-icon></v-btn>
          </template>
          <v-card max-width="400">
            <v-card-text class="black--text text-body-2">
              <!-- <div class="text-subtitle-1">About This Chart</div>
              <v-divider class="mb-2"></v-divider> -->
              <p>
                The Timeseries Chart shows when photos were taken along with the daily or instantanous values of any observed or modeled variables.
              </p>
              <p>
                <b>Hover</b> over the chart to see the photo and values at each date and time.
              </p>
              <p>
                Use the <b>time period selector</b> near the bottom of the chart, the zoom present buttons (1m, 3m, etc), or the date inputs to zoom in on a specific period. When the selected period is less than 30 days, the chart will show sub-daily values of each variable. Otherwise, it will show daily mean values along with the photos taken closest to noon on each date.
              </p>
              <p class="mb-0">
                Use the legend to <b>show/hide</b> individual variables.
              </p>
            </v-card-text>
          </v-card>
        </v-menu>
      </div>
    </div>
    <v-divider></v-divider>
    <highcharts constructor-type="stockChart" :options="chartOptions" ref="chart"></highcharts>
  </div>
</template>

<script>
import { variables } from '@/lib/constants'
import { format } from 'd3-format'
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
  name: 'PhotoTimeseriesChart',
  props: ['loading', 'series', 'images', 'station', 'image', 'scaleValues', 'mode', 'instantaneous'],
  data () {
    return {
      chartOptions: {
        chart: {
          animation: false,
          zoomType: 'x'
        },
        time: {
          // getTimezoneOffset: (timestamp) => {
          //   if (!timestamp) return 0
          //   return -1 * this.$date(timestamp).tz(this.station.timezone).utcOffset()
          // }
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
            turboThreshold: 0,
            point: {
              events: {
                // mouseOver: (e) => {
                //   const image = e.target.image
                //   if (image) {
                //     this.$emit('hover', image)
                //   }
                // }
              }
            }
          }
        },
        rangeSelector: {
          buttons: [
            {
              type: 'month',
              count: 1,
              text: '1m',
              title: 'View 1 month'
            }, {
              type: 'month',
              count: 3,
              text: '3m',
              title: 'View 3 months'
            }, {
              type: 'month',
              count: 6,
              text: '6m',
              title: 'View 6 months'
            }, {
              type: 'year',
              count: 1,
              text: '1y',
              title: 'View 1 year'
            }, {
              type: 'all',
              text: 'All',
              title: 'View all'
            }
          ]
        },
        scrollbar: {
          liveRedraw: false
        },
        legend: {
          enabled: true
        },
        tooltip: {
          animation: false,
          // split: false,
          // shared: true,
          xDateFormat: '%b %e, %Y'
          // hideDelay: 999999999
        },
        navigator: {
          enabled: true,
          adaptToUpdatedData: false,
          series: {
            type: 'line',
            marker: {
              enabled: true
            }
          },
          xAxis: {
            ordinal: false
          },
          yAxis: {
            min: -2,
            max: 1,
            startOnTick: true,
            endOnTick: true
          }
        },
        xAxis: {
          ordinal: false,
          events: {
            afterSetExtremes: this.afterSetExtremes
          }
        }
      }
    }
  },
  watch: {
    series () {
      this.updateChart()
    },
    scaleValues () {
      this.updateChart()
    },
    image () {
      this.highlightImage(this.image)
    },
    instantaneous () {
      this.render()
    },
    loading () {
      // console.log('watch:loading')
      if (!this.chart) return
      if (this.loading) {
        // console.log('watch:loading show')
        this.chart.showLoading()
      } else {
        // console.log('watch:loading hide')
        this.chart.hideLoading()
      }
    }
  },
  async mounted () {
    this.chart = this.$refs.chart.chart
    window.chart = this.chart
    await this.updateChart()
  },
  methods: {
    async afterSetExtremes (event) {
      // console.log('afterSetExtremes', event)
      // this.clearHighlight()
      if (event.min && event.max) {
        this.$emit('zoom', [new Date(event.min), new Date(event.max)])
      }
    },
    render () {
      // console.log('render: start')
      if (this.mode === 'INST') {
        this.renderInstantaneous()
      } else {
        this.renderDaily()
      }
      // console.log('render: done')
    },
    renderInstantaneous () {
      // console.log('renderInstantaneous: start')

      this.chart.series.forEach(s => {
        if (s.name === 'Navigator 1') return

        if (s.name === 'Photo') {
          const images = this.instantaneous.images.map(d => {
            return { x: (new Date(d.timestamp)).valueOf(), y: 0, image: d }
          })
          s.setData(images)
        } else {
          // console.log(s.name, s)
          const instantaneousSeries = this.instantaneous.series.find(ss => ss.name === s.name)
          if (instantaneousSeries) {
            if (s.options.marker.enabled) {
              // console.log('marker.enabled')
              // update marker with image values
              const imageValues = this.instantaneous.images.map(d => {
                const value = d.values.find(v => v.name === s.name)
                return {
                  x: (new Date(d.timestamp)).valueOf(),
                  y: value !== undefined ? (this.scaleValues ? value.rank : value.value) : null,
                  image: d
                }
              }).filter(d => d.y !== null && d.y !== undefined)
              s.setData(imageValues)
            } else {
              // console.log('!marker.enabled')
              // update line with series values
              const seriesValues = instantaneousSeries.data.map(d => {
                return {
                  x: (new Date(d.timestamp)).valueOf(),
                  y: this.scaleValues ? d.rank : d.value
                }
              }).filter(d => d.y !== null && d.y !== undefined)
              s.setData(seriesValues)
            }
          }
        }
      })
      this.chart.render(true, false, false)
      // console.log('renderInstantaneous: done')
    },
    renderDaily () {
      this.chart.series.forEach(s => {
        s.setData(s.options.daily)
      })
      this.chart.render(true, false, false)
    },
    updateChart () {
      // console.log('updateChart: start')
      const seriesVariableIds = this.series.map(d => d.variableId)
      let dataAxes = []
      if (this.scaleValues) {
        dataAxes = [{
          id: 'values',
          title: {
            text: 'Rank Percentile',
            x: -5
          },
          min: 0,
          max: 1,
          type: 'linear',
          top: '25%',
          height: '75%',
          labels: {
            formatter: function () {
              return (this.value * 100).toFixed(0) + '%'
            },
            y: 5,
            x: 40
          },
          opposite: false,
          startOnTick: true,
          endOnTick: true,
          tickAmount: 5,
          showLastLabel: true
        }]
      } else {
        dataAxes = variableAxes.filter(d => seriesVariableIds.includes(d.id))
        dataAxes.forEach((axis, i) => {
          axis.opposite = i > 0
          axis.labels.x = i > 0 ? 10 : 40
          axis.gridLineWidth = i > 0 ? 0 : 1
        })
      }
      const yAxes = [
        {
          id: 'images',
          title: {
            text: 'Photos',
            align: 'middle',
            rotation: 0,
            textAlign: 'right',
            y: 4,
            x: -5
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
      const dailyImages = this.images.map(d => {
        return { x: (new Date(d.date)).valueOf(), y: 0, image: d }
      })
      const $date = this.$date
      const timezone = this.station.timezone
      const that = this
      const imagesSeries = {
        name: 'Photo',
        data: dailyImages,
        daily: dailyImages,
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
            const timestamp = $date(this.image.timestamp).tz(timezone).format('LLL z')
            that.$emit('hover', this.image)
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${timestamp}</b><br/>`
          },
          xDateFormat: '%b %e, %Y'
        }
      }

      const variableSeries = this.series.map((series, i) => {
        const seriesValues = series.data.map(d => {
          return {
            x: (new Date(d.date)).valueOf(),
            y: this.scaleValues ? d.rank : d.value
          }
        })
        const lineSeries = {
          name: series.name,
          source: series.source,
          variableId: series.variableId,
          data: seriesValues,
          daily: seriesValues,
          yAxis: this.scaleValues ? 'values' : series.variableId,
          gapSize: 10,
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
            x: (new Date(d.date)).valueOf(),
            y: value !== undefined ? (this.scaleValues ? value.rank : value.value) : null,
            image: d
          }
        })
        const markerSeries = {
          name: series.name,
          linkedTo: ':previous',
          source: series.source,
          variableId: series.variableId,
          data: imageValues,
          daily: imageValues,
          yAxis: this.scaleValues ? 'values' : series.variableId,
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

        if (this.scaleValues) {
          markerSeries.tooltip.pointFormatter = function () {
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${format('.1%')(this.y)}</b><br/>`
          }
        } else {
          markerSeries.tooltip.pointFormatter = function () {
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${format('.1f')(this.y)}</b><br/>`
          }
        }
        return [lineSeries, markerSeries]
      }).flat()

      const newSeries = [imagesSeries, ...variableSeries]

      // first clear out chart to reset series and yAxes
      // in case the set of series (variables) has changed
      this.chart.update({
        yAxis: [],
        series: []
      }, true, true, false)
      this.chart.update({
        yAxis: yAxes,
        series: newSeries
      }, true, true, false)
      this.render()

      if (variableSeries.length === 0) {
        this.chart.showNoData()
      } else {
        this.chart.hideNoData()
      }

      // console.log('updateChart: done')
    },
    highlightImage (image) {
      // console.log(image)
      // console.log('highlightImage: start')
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
            if (p.image && p.image.id === image.id) {
              if (p.state !== 'hover') {
                p.setState('hover')
              }
              if (s.name !== 'Photo' && s.name !== 'Navigator 1' && p.graphic) {
                p.graphic.toFront()
              }
            } else {
              if (p.state === 'hover') {
                p.setState('')
              }
            }
          })
        })
      }
      // console.log('highlightImage: done')
    },
    clearHighlight () {
      // console.log('clearHighlight: start')
      this.chart.series.forEach(s => {
        if (s.name === 'Navigator 1') return
        s.data.forEach(p => {
          if (p.state === 'hover') {
            p.setState('')
          }
        })
      })
      // console.log('clearHighlight: done')
    }
  }
}
</script>
