<template>
  <div style="min-height:420px">
    <v-row class="justify-center mt-4">
      <v-col cols="12" lg="6">
        <highcharts
          :options="chartOptions"
          ref="chart"
          style="max-width:500px;margin:0 auto"
        ></highcharts>
      </v-col>
      <v-divider vertical></v-divider>
      <v-col cols="12" lg="6">
        <v-sheet class="text-body-2 pr-4" style="max-width:500px">
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
          <v-divider class="mb-4"></v-divider>
          <div v-if="series.length === 0">
            <Alert type="warning" title="No Data Available">
              This station does not have any observed data or model predictions.
            </Alert>
          </div>
          <div v-else-if="series.length <= 1">
            <Alert type="warning" title="Insufficient Data">
              This station only has one variable available. Two are needed to create a scatter plot.
            </Alert>
          </div>
          <div v-else>
            <v-select
              v-model="xSeries"
              label="X Variable"
              :items="series"
              item-text="name"
              dense
              outlined
              hide-details
              return-object
              class="my-4"
            ></v-select>
            <v-select
              v-model="ySeries"
              label="Y Variable"
              :items="series"
              item-text="name"
              dense
              outlined
              hide-details
              return-object
              class="my-4"
            ></v-select>

            <v-checkbox
              :value="scaleValues"
              color="default"
              label="Show as Rank Percentile (0-100%)"
              hide-details
              dense
              @change="$emit('update:scaleValues', !scaleValues)"
            >
            </v-checkbox>
          </div>

          <div class="mt-4">
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
                    The Scatter Chart shows the relationship between the daily mean values of two variables.
                  </p>
                  <p class="mb-0">
                    Hover over the chart to see the photo associated with each daily point, which is the photo taken closest to noon on that date.
                  </p>
                </v-card-text>
              </v-card>
            </v-menu>
          </div>
        </v-sheet>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { format } from 'd3-format'
import { timestampFormat } from '@/lib/time'

export default {
  name: 'ScatterChart',
  props: ['series', 'images', 'station', 'image', 'mode', 'scaleValues', 'timeRange'],
  data () {
    return {
      points: [],
      imageIndex: 0,

      xSeries: null,
      ySeries: null,

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
        legend: {
          enabled: false
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
        }
      }
    }
  },
  watch: {
    scaleValues (val) {
      this.updateChart()
    },
    images (val) {
      this.updateChart()
    },
    series (val) {
      this.updateChart()
    },
    xSeries (val) {
      this.updateChart()
    },
    ySeries (val) {
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
    onClick () {
      console.log('onClick')
      this.chart.series.forEach(s => {
        s.update({
          enableMouseTracking: false
        })
      })
      this.highlightImage(this.image)

      setTimeout(() => {
        this.chart.series.forEach(s => {
          s.update({
            enableMouseTracking: true
          })
        })
        this.highlightImage(this.image)
      }, 1000)
    },
    generatePoints () {
      if (!this.images) {
        return []
      }
      const points = this.images.map(d => {
        const xValue = d.values.find(v => v.name === this.xSeries.name)
        const yValue = d.values.find(v => v.name === this.ySeries.name)
        return {
          image: d,
          xValue,
          yValue
        }
      })

      return points
    },
    updateChart () {
      if (this.series.length >= 2) {
        if (!this.xSeries) {
          this.xSeries = this.series[0]
        }
        if (!this.ySeries) {
          this.ySeries = this.series[1]
        }
      } else {
        this.xSeries = null
        this.ySeries = null
      }

      if (!this.xSeries || !this.ySeries) {
        this.chart.showNoData('Insufficient Data')
        this.chart.update({
          xAxis: [],
          yAxis: [],
          series: []
        }, true, true)
        return
      } else {
        this.chart.hideNoData()
      }

      this.points = this.generatePoints()
      const that = this
      const timezone = this.station.timezone
      const pointSeries = {
        name: `${this.xSeries.name} vs ${this.ySeries.name}`,
        data: this.points.map((d, j) => {
          return {
            x: d.xValue ? d.xValue[this.scaleValues ? 'rank' : 'value'] : null,
            y: d.yValue ? d.yValue[this.scaleValues ? 'rank' : 'value'] : null,
            mode: this.mode,
            xValue: d.xValue,
            yValue: d.yValue,
            image: d.image
          }
        }).filter(d => d.x !== null && d.y !== null && d.x !== undefined && d.y !== undefined),
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
        tooltip: {
          pointFormatter: function () {
            that.$emit('hover', this.image)
            const header = this.mode === 'DAY'
              ? timestampFormat(this.image.timestamp, timezone, 'DD')
              : timestampFormat(this.image.timestamp, timezone)
            const modeLabel = this.mode === 'DAY' ? 'Daily Mean' : ''

            const valueFormat = (x) => {
              return (x === null || x === undefined) ? 'N/A' : format('.1f')(x)
            }
            const rankFormat = (x) => {
              return (x === null || x === undefined) ? 'N/A' : format('.1%')(x)
            }

            return `
              <b>${header}</b>
              <br>
              <table style="border-spacing: 10px 5px; margin-left: -10px; margin-right: -10px">
                <thead>
                  <tr>
                    <th></th>
                    <th colspan="2" class="text-center">${modeLabel}</th>
                  </tr>
                  <tr>
                    <th style="text-align:left">Variable</th>
                    <th class="text-right">Value</th>
                    <th class="text-right">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${this.xValue.name}</td>
                    <td class="text-right">${valueFormat(this.xValue.value)}</td>
                    <td class="text-right">${rankFormat(this.xValue.rank)}</td>
                  </tr>
                  <tr>
                    <td>${this.yValue.name}</td>
                    <td class="text-right">${valueFormat(this.yValue.value)}</td>
                    <td class="text-right">${rankFormat(this.yValue.rank)}</td>
                  </tr>
                </tbody>
              </table>
            `
          }
        }
      }
      let xAxis
      let yAxis
      if (this.scaleValues) {
        xAxis = {
          title: {
            text: this.xSeries.name
          },
          min: 0,
          max: 1,
          type: 'linear',
          gridLineWidth: 1,
          labels: {
            formatter: function () {
              return format('.0%')(this.value)
            }
          },
          opposite: false,
          startOnTick: true,
          endOnTick: true,
          tickAmount: 6,
          showLastLabel: true
        }
        yAxis = {
          title: {
            text: this.ySeries.name
          },
          min: 0,
          max: 1,
          type: 'linear',
          gridLineWidth: 1,
          labels: {
            formatter: function () {
              return format('.0%')(this.value)
            }
          },
          opposite: false,
          startOnTick: true,
          endOnTick: true,
          tickAmount: 6,
          showLastLabel: true
        }
      } else {
        xAxis = {
          title: {
            text: this.xSeries.name
          },
          type: this.xSeries.variableId === 'FLOW_CFS' ? 'logarithmic' : 'linear',
          gridLineWidth: 1,
          labels: {
            formatter: function () {
              return format('.1f')(this.value)
            }
          },
          opposite: false,
          startOnTick: false,
          endOnTick: false,
          tickAmount: 5,
          showLastLabel: true
        }
        yAxis = {
          title: {
            text: this.ySeries.name
          },
          type: this.ySeries.variableId === 'FLOW_CFS' ? 'logarithmic' : 'linear',
          gridLineWidth: 1,
          labels: {
            formatter: function () {
              return format('.1f')(this.value)
            }
          },
          opposite: false,
          startOnTick: false,
          endOnTick: false,
          tickAmount: 5,
          showLastLabel: true
        }
      }
      this.chart.update({
        xAxis: [],
        yAxis: [],
        series: []
      }, true, true, false)

      this.chart.update({
        xAxis,
        yAxis,
        series: pointSeries,
        tooltip: {
          container: this.$refs.tooltip
        }
      }, true, true, false)
      // this.chart.render()
    },
    highlightImage (image) {
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
