<template>
  <v-row class="justify-center mt-4">
    <v-col cols="12" md="7">
      <highcharts :options="chartOptions" ref="chart"></highcharts>
    </v-col>
    <v-col cols="12" md="5">
      <v-sheet class="text-body-2 px-4">
        <div class="text-caption">Timeseries Mode</div>
        <div class="d-flex align-center">
          <b>{{ mode === 'DAY' ? 'Daily Mean' : 'Instantaneous' }}</b>
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
            <div class="mb-2">When the selected time period is more than 30 days, the chart is in <b>Daily Mean</b> mode and each timeseries is aggregated to daily values. Only the photo taken closest to noon on each date will be shown.</div>
            <div>Otherwise, the <b>Instantaneous</b> values of each variable along with all available photos will be shown.</div>
          </v-tooltip>
        </div>
        <div class="text-caption mt-4">Selected Time Period</div>
        <div class="d-flex align-center">
          <div>
            <b>{{ timeRange[0] | timestampFormat('ll') }} - {{ timeRange[1] | timestampFormat('ll') }}</b>
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
                  The Distribution Chart shows the cumulative distribution of each variable.
                </p>
                <p>
                  The x-axis represents the percentile rank, and the y-axis represents the value of each date or photo depending on whether the Timeseries Mode is Daily or Instantaneous.
                </p>
                <p class="mb-0">
                  Hover over the chart to see the photo associated with each point. If multiple variables are available, then all points corresponding to the current photo will be highlighted (one for each variable).
                </p>
              </v-card-text>
            </v-card>
          </v-menu>
        </div>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
import { variables } from '@/lib/constants'
import { format } from 'd3-format'
import dayjs from 'dayjs'

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
    // const $date = this.$date
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
            point: {
              events: {
                mouseOver: (e) => {
                  // console.log('mouseOver', e.target.image.id)
                  this.highlightImage(e.target.image)
                  this.$emit('hover', e.target.image)
                }
              }
            }
          }
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
    updateChart () {
      const chart = this.chart
      const mode = this.mode
      const station = this.station
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
              const header = this.mode === 'DAY'
                ? dayjs(this.image.timestamp).tz(station.timezone).format('ll')
                : dayjs(this.image.timestamp).tz(station.timezone).format('lll')

              const modeLabel = mode === 'DAY' ? 'Daily Mean' : 'Instantaneous'

              const valueFormatter = format('.1f')
              const rankFormatter = format('.1%')

              const valueRows = this.image.values.map(d => {
                const valueLabel = d.value === null || d.value === undefined ? 'N/A' : valueFormatter(d.value)
                const rankLabel = d.rank === null || d.rank === undefined ? 'N/A' : rankFormatter(d.rank)

                const series = chart.series.find(s => s.name === d.name)
                if (!series.visible) return ''

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
    },
    highlightImage (image) {
      // console.log('highlightImage', image)
      if (this.chart.hoverPoints !== undefined && this.chart.hoverPoints !== null) {
        // console.log('mousing', this.chart.hoverPoints)
        // user is mousing over chart
        this.chart.series.forEach(s => {
          s.points.forEach(p => {
            if (this.chart.hoverPoints.includes(p) && p.graphic) {
              // bring hovered point to front
              p.graphic.toFront()
            } else if (p.image.id === image.id) {
              // hover paired point (same image)
              p.setState('hover')
              if (p.graphic) {
                p.graphic.toFront()
              }
            } else if (p.state === 'hover') {
              // unhighlight point
              p.setState('')
            }
          })
        })
      } else {
        // highlight is triggered by parent (next/prev, play)
        this.chart.series.forEach(s => {
          s.points.forEach(p => {
            if (p.image.id === image.id) {
              if (p.state !== 'hover') {
                p.setState('hover')
              }
              if (p.graphic) {
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
    }
  }
}
</script>
