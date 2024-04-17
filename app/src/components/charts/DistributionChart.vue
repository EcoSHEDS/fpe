<template>
  <v-row class="justify-center mt-4">
    <v-col cols="12" lg="6" class="text-center">
      <highcharts
        :options="chartOptions"
        ref="chart"
        style="max-width:500px;margin:0 auto"
      ></highcharts>
    </v-col>
    <v-divider vertical></v-divider>
    <v-col cols="12" lg="6">
      <v-sheet class="text-body-2">
        <v-simple-table dense>
          <tbody>
            <tr>
              <td
                class="text-right grey--text text--darken-2"
                style="width:180px">
                Mode:
              </td>
              <td class="font-weight-bold">
                <v-chip small label v-if="mode === 'DAY'">DAILY</v-chip>
                <v-chip small label v-else>SUB-DAILY</v-chip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      small
                      icon
                      v-on="on"
                      color="default"
                      class="ml-2 mb-1"
                    ><v-icon small>mdi-information</v-icon></v-btn>
                  </template>
                  <span v-if="mode === 'DAY'">Select a time period of 30 days or less on the Timeseries chart to switch to Sub-daily mode</span>
                  <span v-else>Select a time period longer than 30 days on the Timeseries chart to switch to Daily mode</span>
                </v-tooltip>
              </td>
            </tr>
            <tr>
              <td
                class="text-right grey--text text--darken-2"
                style="width:180px">
                Selected Time Period:
              </td>
              <td class="font-weight-bold">
                <b>{{ timeRange[0] | formatTimestamp(station.timezone, 'DD') }} - {{ timeRange[1] | formatTimestamp(station.timezone, 'DD') }}</b>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      small
                      icon
                      v-on="on"
                      color="default"
                      class="ml-2 mb-1"
                    ><v-icon small>mdi-information</v-icon></v-btn>
                  </template>
                  <span>Use the Timeseries chart to select a different time period</span>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-sheet>
      <v-divider class="mb-4"></v-divider>
      <div v-if="series.length === 0">
        <Alert type="warning" title="No Data Available">
          This station does not have any observed data or model predictions.
        </Alert>
      </div>

      <div class="mt-4 d-flex">
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn
              small
              depressed
              v-on="on"
              color="default"
            >About This Chart <v-icon right small>mdi-menu-down</v-icon></v-btn>
          </template>
          <v-card max-width="400">
            <v-card-text class="black--text text-body-2">
              <p>
                The Distribution Chart shows the cumulative distribution of each variable.
              </p>
              <p>
                The x-axis represents the percentile rank, and the y-axis represents the value of each date or photo depending on whether the Timeseries Mode is Daily or Sub-Daily.
              </p>
              <p class="mb-0">
                Hover over the chart to see the photo associated with each point. If multiple variables are available, then all points corresponding to the current photo will be highlighted (one for each variable).
              </p>
            </v-card-text>
          </v-card>
        </v-menu>
      </div>
    </v-col>
  </v-row>
</template>

<script>
import { variables } from '@/lib/constants'
import { timestampFormat } from '@/lib/time'
import { format } from 'd3-format'

const variableAxes = variables.map((variable, i) => {
  return {
    id: variable.id,
    title: {
      text: variable.id
    },
    alignTicks: true,
    startOnTick: true,
    endOnTick: true,
    type: variable?.axis?.type || 'linear'
  }
})
variableAxes.push({
  id: 'SCORE',
  title: {
    text: 'MODEL SCORE'
  },
  alignTicks: true,
  startOnTick: true,
  endOnTick: true,
  type: 'linear'
})

export default {
  name: 'DistributionChart',
  props: ['series', 'images', 'station', 'image', 'timeRange', 'mode'],
  data () {
    return {
      scaleValues: false,
      disableHover: false,
      chartOptions: {
        animation: false,
        chart: {
          type: 'scatter',
          zoomType: 'xy',
          height: '400px',
          events: {
            click: () => {
              this.onClick()
            }
          }
        },
        title: {
          text: null
        },
        plotOptions: {
          series: {
            animation: false,
            turboThreshold: 0,
            point: {
              events: {
                click: () => {
                  this.onClick()
                }
              }
            }
          }
        },
        tooltip: {
          animation: false,
          outside: true,
          useHTML: true,
          headerFormat: '',
          shape: 'rect',
          positioner: function () {
            return {
              x: this.chart.container.getBoundingClientRect().width,
              y: 10
            }
          }
        },
        xAxis: {
          title: {
            text: 'Rank Percentile'
          },
          min: 0,
          max: 1,
          labels: {
            formatter: function () {
              return (this.value * 100).toFixed(0) + '%'
            }
          },
          gridLineWidth: 1
        }
      }
    }
  },
  watch: {
    images () {
      this.updateChart()
    },
    series () {
      this.updateChart()
    },
    image () {
      this.highlightImage()
    }
  },
  async mounted () {
    this.chart = this.$refs.chart.chart
    this.chart.container.onmouseout = () => {
      this.highlightImage()
    }
    await this.updateChart()
  },
  beforeDestroy () {
    this.chart.container.onmouseout = null
  },
  methods: {
    onClick () {
      // console.log('onClick', this.disableHover)
      if (this.disableHover) return

      this.disableHover = true
      this.chart.series.forEach(s => {
        s.update({
          enableMouseTracking: false
        })
      })
      this.highlightImage()

      setTimeout(() => {
        this.disableHover = false
        this.chart.series.forEach(s => {
          s.update({
            enableMouseTracking: true
          })
        })
        this.highlightImage()
      }, 1000)
    },
    updateChart () {
      const chart = this.chart
      const mode = this.mode
      const station = this.station
      const that = this
      const pointSeries = this.series.map((series, i) => {
        const values = this.images.map(d => {
          const value = d.values.find(v => v.name === series.name)
          return {
            x: value ? value.rank : null,
            y: value ? value.value : null,
            image: d,
            mode: this.mode
          }
        }).filter(d => d.x !== null && d.y !== null)
        return {
          name: series.name,
          data: values,
          marker: {
            symbol: 'circle',
            radius: 3,
            lineWidth: 1,
            states: {
              hover: {
                animation: false,
                radiusPlus: 5
              },
              normal: {
                animation: false
              }
            }
          },
          states: {
            inactive: {
              opacity: 1
            }
          },
          yAxis: series.variableId,
          tooltip: {
            pointFormatter: function () {
              that.$emit('hover', this.image)

              const header = this.mode === 'DAY'
                ? timestampFormat(this.image.timestamp, station.timezone, 'DD')
                : timestampFormat(this.image.timestamp, station.timezone)

              const modeLabel = mode === 'DAY' ? 'Daily' : 'Sub-Daily'

              const valueFormatter = format('.1f')
              const rankFormatter = format('.1%')

              const valueRows = this.image.values.map(d => {
                const valueLabel = d.value === null || d.value === undefined ? 'N/A' : valueFormatter(d.value)
                const rankLabel = d.rank === null || d.rank === undefined ? 'N/A' : rankFormatter(d.rank)

                const series = chart.series.find(s => s.name === d.name)
                if (!series || !series.visible) return ''

                return `
                  <tr>
                    <td><span style="color:${series.color}">●</span></td>
                    <td>${d.name}</td>
                    <td class="text-right">${valueLabel}</td>
                    <td class="text-right">${rankLabel}</td>
                  </tr>
                `
              }).join('')

              return `
                <b>${header}</b>
                <br>
                <table style="border-spacing: 10px 5px; margin-left: -10px; margin-right: -10px">
                  <thead>
                    <tr>
                      <th></th>
                      <th></th>
                      <th colspan="2" class="text-center">${modeLabel}</th>
                    </tr>
                    <tr>
                      <th></th>
                      <th style="text-align:left">Variable</th>
                      <th class="text-right">Value</th>
                      <th class="text-right">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${valueRows}
                  </tbody>
                </table>
              `
            }
          }
        }
      })

      const seriesVariableIds = this.series.map(d => d.variableId)
      const yAxes = [
        ...variableAxes.filter(d => seriesVariableIds.includes(d.id))
      ]
      yAxes.forEach((d, i) => {
        d.opposite = i > 0
        d.gridLineWidth = i > 0 ? 0 : 1
      })

      // first clear out chart to reset series and yAxes
      // in case the set of series (variables) has changed
      this.chart.update({
        yAxis: [],
        series: []
      }, true, true, false)
      this.chart.update({
        yAxis: yAxes,
        series: pointSeries
      }, true, true, false)
      this.chart.render()
    },
    highlightImage () {
      if (!this.chart) return

      if (this.chart.hoverPoints !== undefined && this.chart.hoverPoints !== null) {
        const imageIds = this.chart.hoverPoints.map(p => p.image.id)
        this.chart.series.forEach(s => {
          if (!s.points || !s.visible) return
          s.points.forEach(p => {
            p.setState('')
            if (imageIds.includes(p.image.id)) {
              p.setState('hover')
              p.graphic && p.graphic.toFront()
            }
          })
        })
      } else {
        this.chart.series.forEach(s => {
          if (!s.points || !s.visible) return
          s.points.forEach(p => {
            p.setState('')
            if (p.image && this.image && p.image.id === this.image.id) {
              p.setState('hover')
              p.graphic && p.graphic.toFront()
            }
          })
        })
      }
    }
  }
}
</script>
