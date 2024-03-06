<template>
  <div style="min-height:420px">
    <v-row class="justify-center mt-4">
      <v-col cols="12" md="6">
        <highcharts :options="chartOptions" ref="chart"></highcharts>
      </v-col>
      <v-col cols="12" md="6">
        <v-sheet class="text-body-2 px-4">
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

          <div class="text-subtitle-1 mt-4">About This Chart</div>
          <v-divider class="mb-2"></v-divider>
          <p>
            The Scatter Chart shows the relationship between the daily mean values of two variables.
          </p>
          <p>
            Hover over the chart to see the photo associated with each daily point, which is the photo taken closest to noon on that date.
          </p>
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
// import { variables } from '@/lib/constants'
import { format } from 'd3-format'
import { utcFormat } from 'd3-time-format'

export default {
  name: 'ScatterChart',
  props: ['series', 'images', 'station', 'image', 'scaleValues', 'timeRange'],
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
      const points = this.images.map(image => {
        const date = image.date
        const xValue = this.xSeries.data.find(d => d.date === date)
        const yValue = this.ySeries.data.find(d => d.date === date)
        return {
          date: image.date,
          image: image.image,
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
      const pointSeries = {
        name: `${this.series[0].name} vs ${this.series[1].name}`,
        data: this.points.map((d, j) => {
          return {
            x: d.xValue ? d.xValue[this.scaleValues ? 'rank' : 'value'] : null,
            y: d.yValue ? d.yValue[this.scaleValues ? 'rank' : 'value'] : null,
            image: d.image,
            date: d.date
          }
        }).filter(d => d.x !== null && d.y !== null),
        marker: {
          symbol: 'circle',
          radius: 3,
          // lineColor: 'goldenrod',
          lineWidth: 1,
          states: {
            hover: {
              radiusPlus: 5
            }
          }
        },
        tooltip: {
          headerFormat: '',
          pointFormatter: function () {
            const formatter = that.scaleValues ? format('.1%') : format('.1f')
            return `${utcFormat('%b %d, %Y')(new Date(this.date))}<br>${that.xSeries.name}: <b>${formatter(this.x)}</b><br>${that.ySeries.name}: <b>${formatter(this.y)}</b>`
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
        series: pointSeries
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
