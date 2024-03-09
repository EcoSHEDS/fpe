<template>
  <div style="min-height:420px">
    <v-row class="justify-center mt-4">
      <v-col cols="12" md="6">
        <highcharts :options="chartOptions" ref="chart"></highcharts>
      </v-col>
      <v-col cols="12" md="6">
        <v-sheet class="text-body-2 px-4">
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
              @change="$emit('update:scaleValues', !scaleValues)"
            >
            </v-checkbox>
          </div>

          <div class="my-4" ref="tooltip"></div>

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
    <!-- <div v-else class="mt-4 d-flex justify-center">
      <Alert title="Insufficient Data" style="max-width:600px" type="error">
        The Scatterplot Chart requires at least two variables of observed data and/or model results.
      </Alert>
    </div> -->
  </div>
</template>

<script>
import { format } from 'd3-format'
import dayjs from 'dayjs'

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
          height: '400px'
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
                mouseOver: (e) => {
                  this.$emit('hover', e.target.image)
                }
              }
            }
          }
        },
        legend: {
          enabled: false
        },
        tooltip: {
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
    await this.updateChart()
  },
  methods: {
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
            const header = this.mode === 'DAY'
              ? dayjs(this.image.timestamp).tz(timezone).format('ll')
              : dayjs(this.image.timestamp).tz(timezone).format('lll')
            const modeLabel = this.mode === 'DAY' ? 'Daily Mean' : 'Instantaneous'

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
      }, true, true)

      this.chart.update({
        // time: {
        //   timezone: this.station.timezone
        // },
        xAxis,
        yAxis,
        series: pointSeries,
        tooltip: {
          container: this.$refs.tooltip
        }
      }, true, true)
    },
    highlightImage (image) {
      this.chart.series.forEach(s => {
        s.data.forEach(p => {
          if (p.image && p.image === image) {
            if (p.state !== 'hover') {
              p.setState('hover')
            }
            p.graphic.toFront()
          } else {
            if (p.state === 'hover') {
              p.setState('')
            }
          }
        })
      })
    }
  }
}
</script>
