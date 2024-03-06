<template>
  <div>
    <div class="d-flex px-8 py-4 align-center">
      <div class="text-body-2">
        <span style="vertical-align: middle;">Mode: <b>{{ mode === 'day' ? 'Daily Mean' : 'Instantaneous' }}</b></span>
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
            >About This Chart</v-btn>
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
                Use the <b>time period selector</b> near the bottom of the chart, the zoom present buttons (1m, 3m, etc), or the date inputs to zoom in on a specific period. When the selected period is less than 30 days, the chart will show instantaneous values of each variable. Otherwise, it will show daily mean values along with the photos taken closest to noon on each date.
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
      distance: 0,
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
    distance: 0,
    y: 4
  }
})

export default {
  name: 'TimeseriesChart',
  props: ['series', 'images', 'station', 'image', 'scaleValues'],
  data () {
    return {
      mode: 'day', // 'day' or 'raw'
      chartOptions: {
        animation: false,
        chart: {
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
                mouseOver: (e) => {
                  const image = e.target.image
                  if (image) {
                    this.$emit('hover', image)
                  }
                }
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
          series: {
            type: 'line',
            marker: {
              enabled: true
            }
          },
          xAxis: {
            ordinal: false
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
    }
  },
  async mounted () {
    this.chart = this.$refs.chart.chart
    window.chart = this.chart
    await this.updateChart()
  },
  methods: {
    async afterSetExtremes (event) {
      this.clearHighlight()
      this.$emit('zoom', [new Date(event.min), new Date(event.max)])
    },
    async fetchRawImages (stationId, start, end) {
      const url = `/stations/${stationId}/images`
      const response = await this.$http.public.get(url, {
        params: {
          start: this.$date(start).toISOString(),
          end: this.$date(end).toISOString()
        }
      })
      const images = response.data
      images.forEach(d => {
        d.timestampRaw = d.timestamp
        d.timestamp = this.$date(d.timestamp).tz(this.station.timezone)
        d.timestampUtc = this.$date(d.timestampRaw).add(d.timestamp.utcOffset() / 60, 'hour').toDate()
      })
      return images.filter(d => d.timestamp.isBetween(start, end, null, '[]'))
    },
    async fetchRawData (stationId, variableId, start, end) {
      const url = `/stations/${stationId}/values`
      const response = await this.$http.public.get(url, {
        params: {
          variable: variableId,
          start: this.$date(start).subtract(1, 'day').toISOString(),
          end: this.$date(end).add(1, 'day').toISOString()
        }
      })
      const values = response.data
      values.forEach((d, i) => {
        d.timestampRaw = d.timestamp
        d.timestamp = this.$date(d.timestamp).tz(this.station.timezone)
        d.timestampUtc = this.$date(d.timestampRaw).add(d.timestamp.utcOffset() / 60, 'hour')
      })
      return values
    },
    updateChart () {
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
            x: 0
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
          axis.gridLineWidth = i > 0 ? 0 : 1
        })
      }
      const yAxes = [
        {
          id: 'images',
          title: {
            text: 'Photos',
            x: -10
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
        return { x: (new Date(d.date)).valueOf(), y: 0, image: d.image }
      })
      const $date = this.$date
      const timezone = this.station.timezone
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
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${timestamp}</b><br/>`
          },
          xDateFormat: '%b %e, %Y'
        }
      }

      const variableSeries = this.series.map((series, i) => {
        const dailyValues = series.data.map(d => {
          const image = this.images.find(image => image.date === d.date)?.image
          return {
            x: (new Date(d.date)).valueOf(),
            y: this.scaleValues ? d.rank : d.value,
            image
          }
        })
        const s = {
          name: series.name,
          source: series.source,
          variableId: series.variableId,
          data: dailyValues,
          daily: dailyValues,
          yAxis: this.scaleValues ? 'values' : series.variableId,
          gapSize: 2,
          legend: {
            enabled: true
          },
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
              lineWidthPlus: 0,
              halo: {
                size: 0
              }
            }
          }
        }
        if (this.scaleValues) {
          s.tooltip.pointFormatter = function () {
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${format('.1%')(this.y)}</b><br/>`
          }
        } else {
          s.tooltip.pointFormatter = function () {
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name.toUpperCase()}: <b>${format('.1f')(this.y)}</b><br/>`
          }
        }
        return s
      })
      const newSeries = [imagesSeries, ...variableSeries]

      // first clear out chart to reset series and yAxes
      // in case the set of series (variables) has changed
      this.chart.update({
        yAxis: [],
        series: []
      }, true, true, false)
      this.chart.colorCounter = 0
      this.chart.update({
        // time: {
        //   timezone: this.station.timezone
        // },
        yAxis: yAxes,
        series: newSeries
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
    },
    clearHighlight () {
      this.chart.series.forEach(s => {
        if (s.name === 'Navigator 1') return
        s.data.forEach(p => {
          if (p.state === 'hover') {
            p.setState('')
          }
        })
      })
    }
  }
}
</script>
