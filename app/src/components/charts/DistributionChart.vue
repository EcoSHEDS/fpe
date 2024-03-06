<template>
  <v-row class="justify-center mt-4">
    <v-col cols="12" md="7">
      <highcharts :options="chartOptions" ref="chart"></highcharts>
    </v-col>
    <v-col cols="12" md="5">
      <v-sheet class="text-body-2 px-4">
        <div class="text-caption">Timeseries Mode</div>
        <div class="d-flex align-center">
          <b>Daily Mean</b>
          <v-spacer></v-spacer>
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
            <div>Each point shows the <b>daily mean value</b> and rank percentile.</div>
            <div>Photo associated with each point is the one taken closest to noon on that date.</div>
          </v-tooltip>
        </div>
        <div class="text-caption mt-4">Selected Time Period</div>
        <div class="d-flex align-center">
          <div>
            <b>{{ timeRange[0] | timestampFormat('lll') }} - {{ timeRange[1] | timestampFormat('lll') }}</b>
          </div>
          <v-spacer></v-spacer>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn
                small
                icon
                v-on="on"
                color="default"
                class="ml-2"
              ><v-icon small>mdi-information</v-icon></v-btn>
            </template>
            <span>Use the timeseries chart to change the time period</span>
          </v-tooltip>
        </div>
        <div class="text-subtitle-1 mt-8">About This Chart</div>
        <v-divider class="mb-2"></v-divider>
        <p>
          The Distribution Chart shows the cumulative distribution of each variable.
        </p>
        <p>
          The x-axis represents the percentile rank, and the y-axis represents the value of each date or photo depending on whether the Timeseries Mode is Daily or Instantaneous.
        </p>
        <p>
          Hover over the chart to see the photo associated with each point. If multiple variables are available, then all points corresponding to the current photo will be highlighted (one for each variable).
        </p>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
import { variables } from '@/lib/constants'
import { format } from 'd3-format'
import { utcFormat } from 'd3-time-format'

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
  props: ['series', 'images', 'station', 'image', 'timeRange'],
  data () {
    return {
      scaleValues: false,
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
            states: {
              inactive: {
                opacity: 0.7
              }
            },
            tooltip: {
              // headerFormat: '<b>{series.name}</b><br>',
              pointFormatter: function () {
                const date = utcFormat('%B %d, %Y')(new Date(this.date))
                return `<br>Date: <b>${date}</b><br>Value: <b>${format('.1f')(this.y)}</b><br>Rank: <b>${format('.1%')(this.x)}</b>`
              }
            },
            point: {
              events: {
                mouseOver: (e) => {
                  this.$emit('hover', e.target.image)
                }
              }
            }
          }
        },
        tooltip: {
          // positioner: function () {
          //   return { x: 90, y: 20 } // fixed position (top-left)
          // }
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
        const values = this.series.map((series, i) => {
          const value = series.data.find(d => d.date === date)
          return {
            seriesIndex: i,
            variableId: series.variableId,
            name: series.name,
            date,
            value: value ? value.value : null,
            rank: value ? value.rank : null
          }
        })
        return {
          date: image.date,
          image: image.image,
          values
        }
      })

      return points
    },
    updateChart () {
      const points = this.generatePoints()
      const pointSeries = this.series.map((series, i) => {
        return {
          name: series.name,
          data: points.map((d, j) => {
            return {
              x: d.values[i] ? d.values[i].rank : null,
              y: d.values[i] ? d.values[i].value : null,
              date: d.date,
              image: d.image,
              index: i
            }
          }).filter(d => d.x !== null && d.y !== null),
          marker: {
            symbol: 'circle',
            radius: 3,
            lineWidth: 1,
            states: {
              hover: {
                radiusPlus: 5
              }
            }
          },
          yAxis: series.variableId
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
