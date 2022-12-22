<template>
  <v-container>
    <div>
      <v-row align="stretch" style="height:275px">
        <v-col cols="6">
          <v-img v-if="hover && hover.image" :src="hover.image.thumb_url"></v-img>
          <div v-else>No image</div>
          <!-- {{ hover && hover.image && hover.image.thumb_url}} -->
        </v-col>
        <v-divider inset vertical></v-divider>
        <v-col cols="6">
          <div v-if="!hover">
            No hover
          </div>
          <div v-else-if="mode === 'daily'">
            date: {{ hover.date }}<br>
            value: {{ hover.value && hover.value.mean }}
          </div>
          <div v-else>
            timestamp: {{ hover.timestamp }}<br>
            value: {{ hover.value }}
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn color="success" outlined @click="play" class="mr-4">Play</v-btn>
          <v-btn color="error" outlined @click="stop">Stop</v-btn>
        </v-col>
      </v-row>
    </div>

    <v-divider class="my-4"></v-divider>

    <div>
      <v-row class="d-flex">
        <v-spacer></v-spacer>
        <v-col cols="4">
          <v-select
            v-show="variable.options.length > 0"
            :items="variable.options"
            v-model="variable.selected"
            label="Select Variable"
            hide-details
            item-text="label"
            return-object
            dense
            outlined
          ></v-select>
        </v-col>
      </v-row>
      <highcharts
        :constructor-type="'stockChart'"
        :options="settings"
        ref="chart"
      ></highcharts>
    </div>
  </v-container>
</template>

<script>
import { scaleLinear } from 'd3'

export default {
  name: 'NewStationViewer',
  props: ['station'],
  data () {
    return {
      loading: false,
      variable: {
        selected: null,
        options: [
          {
            id: 'FLOW_CFS',
            label: 'Flow',
            units: 'cfs'
          }
        ]
      },
      mode: 'daily',
      daily: {
        images: [],
        values: [],
        usgs: []
      },
      raw: {
        images: [],
        values: []
      },
      hover: null,
      player: {
        i: 0,
        interval: null,
        playing: false
      },
      settings: {
        chart: {
          // height: 500,
          marginTop: 20,
          marginLeft: 70,
          spacingLeft: 0,
          zoomType: 'x',
          animation: false,
          events: {
            load: (e) => {
              this.chart = e.target
              window.chart = this.chart
              this.fetchDaily()
            }
          }
        },
        legend: {
          enabled: true
        },
        plotOptions: {
          series: {
            animation: false,
            showInNavigator: false,
            gapSize: 2,
            states: {
              select: {
                enabled: false
              },
              inactive: {
                opacity: 1
              }
            },
            point: {
              events: {
                mouseOver: (e) => this.onHover(e.target.x)
              }
            }
          },
          line: {
            lineWidth: 1,
            states: {
              hover: {
                lineWidthPlus: 0
              }
            }
          },
          arearange: {
            lineWidth: 0,
            color: 'black',
            fillOpacity: 0.2,
            zIndex: 0,
            label: {
              enabled: false
            },
            marker: {
              enabled: false,
              states: {
                hover: {
                  enabled: false
                }
              }
            },
            tooltip: {
              pointFormat: null
            },
            states: {
              hover: {
                enabled: false
              },
              select: {
                enabled: false
              }
            }
          }
        },
        lang: {
          noData: 'No data to display'
        },
        noData: {
          style: {
            fontWeight: 'bold',
            fontSize: '15px',
            color: '#303030'
          }
        },
        tooltip: {
          animation: false,
          enabled: true,
          shared: true,
          split: true
        },
        scrollbar: {
          liveRedraw: false
        },
        navigator: {
          adaptToUpdatedData: false,
          series: [
            {
              id: 'nav-image',
              type: 'line',
              visible: true,
              color: 'gold',
              gapSize: 2,
              lineWidth: 10,
              data: [],
              dataGrouping: {
                enabled: false
              },
              showInNavigator: true
            }, {
              id: 'nav-value',
              type: 'areaspline',
              visible: true,
              color: undefined,
              data: [],
              dataGrouping: {
                enabled: false
              },
              showInNavigator: true
            }
          ]
        },
        xAxis: {
          ordinal: false,
          events: {
            afterSetExtremes: this.afterSetExtremes
          }
        },
        yAxis: [{
          labels: {
            align: 'right',
            y: 5
          },
          height: '80%',
          opposite: false,
          showLastLabel: false,
          min: 0,
          title: {
            text: 'Units',
            align: 'high',
            rotation: 0,
            textAlign: 'right',
            x: -15,
            y: 0,
            // margin: 15,
            offset: 0,
            style: {
              textAlign: 'right'
            }
          }
        }, {
          labels: {
            align: 'right',
            enabled: false
          },
          top: '80%',
          height: '20%',
          opposite: false,
          title: {
            text: 'Photos',
            align: 'middle',
            textAlign: 'right',
            margin: 0,
            offset: 0,
            reserveSpace: false,
            rotation: 0,
            x: 0,
            y: 4
          }
        }],
        series: [
          {
            id: 'daily-values-mean',
            name: 'User Uploaded',
            mode: 'daily',
            type: 'line',
            data: [],
            tooltip: {
              pointFormat: '<span style="color:{point.color}">●</span> Mean: <b>{point.y}</b><br/>'
            },
            yAxis: 0,
            showInNavigator: false,
            showInLegend: true
          }, {
            id: 'daily-values-range',
            mode: 'daily',
            type: 'arearange',
            data: [],
            yAxis: 0,
            showInNavigator: false,
            showInLegend: false
          }, {
            id: 'daily-usgs',
            name: 'USGS NWIS',
            mode: 'daily',
            type: 'line',
            data: [],
            color: 'darkgreen',
            tooltip: {
              pointFormat: '<span style="color:{point.color}">●</span> USGS NWIS: <b>{point.y}</b><br/>'
            },
            marker: {
              symbol: 'circle'
            },
            yAxis: 0,
            showInNavigator: false,
            showInLegend: true
          }, {
            id: 'daily-usgs-provisional',
            name: 'USGS NWIS (Provisional)',
            mode: 'daily',
            type: 'line',
            data: [],
            color: 'orangered',
            tooltip: {
              pointFormat: '<span style="color:{point.color}">●</span> USGS NWIS: <b>{point.y}</b> (<b>Provisional</b>)<br/>'
            },
            marker: {
              symbol: 'circle'
            },
            yAxis: 0,
            showInNavigator: false,
            showInLegend: true
          }, {
            id: 'daily-image',
            mode: 'daily',
            type: 'line',
            data: [],
            lineWidth: 0,
            color: 'goldenrod',
            marker: {
              enabled: true,
              symbol: 'circle',
              fillColor: 'gold',
              lineWidth: 1,
              lineColor: 'goldenrod',
              radius: 5
            },
            yAxis: 1,
            tooltip: {
              pointFormat: null
              // pointFormat: '<span style="color:{point.color}">●</span> Image ID: <b>{point.image.id}</b><br/>'
              // pointFormat: '<span style="color:{point.color}">●</span> Image'
            },
            showInLegend: false
          }, {
            id: 'raw-values',
            name: 'User Uploaded',
            mode: 'raw',
            type: 'line',
            data: [],
            visible: false,
            enableMouseTracking: false,
            yAxis: 0,
            showInLegend: false
          }, {
            id: 'raw-usgs',
            name: 'USGS NWIS',
            mode: 'raw',
            type: 'line',
            data: [],
            visible: false,
            enableMouseTracking: false,
            yAxis: 0,
            showInLegend: false
          }, {
            id: 'raw-usgs-provisional',
            name: 'USGS NWIS (Provisional)',
            mode: 'raw',
            type: 'line',
            data: [],
            visible: false,
            enableMouseTracking: false,
            yAxis: 0,
            showInLegend: false
          }, {
            id: 'raw-image-value',
            mode: 'raw',
            type: 'line',
            data: [],
            visible: false,
            lineWidth: 0,
            tooltip: {
              pointFormat: '<span style="color:{point.color}">●</span> Value: <b>{point.y}</b><br/>'
            },
            dataGrouping: {
              enabled: false
            },
            yAxis: 0,
            showInLegend: false
          }, {
            id: 'raw-image',
            mode: 'raw',
            type: 'line',
            data: [],
            lineWidth: 0,
            color: 'goldenrod',
            marker: {
              enabled: true,
              symbol: 'circle',
              fillColor: 'gold',
              lineWidth: 1,
              lineColor: 'goldenrod',
              radius: 5
            },
            dataGrouping: {
              enabled: false
            },
            yAxis: 1,
            tooltip: {
              pointFormat: '<span style="color:{point.color}">●</span> Image<br/>'
            },
            showInLegend: false
          }
        ],
        credits: {
          enabled: false
        },
        responsive: {
          rules: [{
            condition: {
              maxWidth: 800
            },
            chartOptions: {
              rangeSelector: {
                inputEnabled: false
              }
            }
          }]
        }
      }
    }
  },
  async mounted () {
    this.variable.selected = this.variable.options[0]
  },
  watch: {
    'variable.selected' () {
      this.onSelectVariable()
    },
    mode (value, old) {
      const redraw = true

      this.chart.series.forEach((d, i) => {
        if (d.options.mode === old) {
          d.setVisible(false, redraw)
        } else if (d.options.mode === value) {
          d.setVisible(true, redraw)
        }
      })
      this.renderNoData()
      this.renderMode()
    }
  },
  beforeDestroy () {
    this.stop()
  },
  methods: {
    play () {
      this.player.playing = true
      let n = 0
      if (this.mode === 'daily') {
        n = this.chart.get('daily-image').points.length
      } else {
        n = this.chart.get('raw-image').points.length
      }

      this.player.i = 0
      this.player.interval = setInterval(() => {
        if (this.player.i === n - 1) {
          this.player.i = 0
        }
        if (this.mode === 'daily') {
          this.chart.get('daily-image').points[this.player.i].onMouseOver('test')
        } else {
          this.chart.get('raw-image').points[this.player.i].onMouseOver('test')
        }
        this.player.i++
      }, 200)
    },
    stop () {
      clearInterval(this.player.interval)
      this.player.playing = false
    },
    onSelectVariable () {
      if (!this.chart) return
      this.chart.yAxis[0].setTitle({ text: this.variable.selected.units || 'No Units' })
    },
    async afterSetExtremes () {
      if (!this.chart) return
      const extremes = this.chart.xAxis[0].getExtremes()
      if (!extremes.min || !extremes.max) return

      const start = this.$date(extremes.min)
      const end = this.$date(extremes.max)
      const durationDays = end.diff(start, 'day', true)

      if (durationDays <= 31) {
        await this.fetchRaw(start.startOf('day').toDate(), end.startOf('day').add(1, 'day').toDate())
        this.mode = 'raw'
      } else if (this.mode === 'raw') {
        this.mode = 'daily'
      }
      this.renderNoData()
    },
    async fetchDaily () {
      await this.fetchDailyImages()
      await this.fetchDailyValues()
    },
    async fetchDailyImages () {
      try {
        const images = await this.$http.public
          .get(`/stations/${this.station.id}/daily/images`)
          .then(d => d.data)
        this.daily.images = images.map(d => ({
          ...d.image,
          date: d.date.substr(0, 10)
        }))
        this.renderImages()
      } catch (err) {
        console.error(err)
      }
    },
    async fetchDailyValues () {
      if (!this.daily.images || this.daily.images.length === 0 || !this.variable.selected) {
        this.daily.values = []
        this.daily.usgs = []
        return
      }
      const variableId = this.variable.selected.id
      try {
        const startDate = this.daily.images[0].date
        const endDate = this.daily.images[this.daily.images.length - 1].date
        this.daily.values = await this.$http.public
          .get(`/stations/${this.station.id}/daily/values?variableId=${variableId}&start=${startDate}&end=${endDate}`)
          .then(d => d.data)
        if (variableId === 'FLOW_CFS') {
          this.daily.usgs = await this.$usgs.getDailyFlows('01171000', startDate, endDate)
        } else {
          this.daily.usgs = []
        }
        this.renderDaily()
        this.renderNoData()
      } catch (err) {
        console.error(err)
      }
    },
    renderMode () {
      const isRaw = this.mode === 'raw'
      console.log('renderMode', isRaw)

      this.chart.get('daily-values-mean').update({ showInLegend: !isRaw }, false)
      this.chart.get('daily-usgs').update({ showInLegend: !isRaw }, false)
      this.chart.get('daily-usgs-provisional').update({ showInLegend: !isRaw }, false)

      this.chart.get('raw-values').update({ showInLegend: isRaw }, false)
      this.chart.get('raw-usgs').update({ showInLegend: isRaw }, false)
      this.chart.get('raw-usgs-provisional').update({ showInLegend: isRaw }, false)
      this.chart.redraw()
    },
    async renderDaily () {
      if (!this.chart) return

      const meanValues = this.daily.values.map(d => [(new Date(d.date)).valueOf(), d.mean])
      const rangeValues = this.daily.values.map(d => [(new Date(d.date)).valueOf(), null, null])
      this.chart.get('daily-values-mean').setData(meanValues, false)
      this.chart.get('daily-values-range').setData(rangeValues, false)

      const usgsValues = this.daily.usgs.filter(d => d.date < '2021-03-01' && !d.provisional).map(d => [(new Date(d.date)).valueOf(), d.mean])
      const usgsProvisional = this.daily.usgs.filter(d => d.date >= '2021-03-01' || d.provisional).map(d => [(new Date(d.date)).valueOf(), d.mean])
      this.chart.get('daily-usgs').setData(usgsValues, false)
      this.chart.get('daily-usgs-provisional').setData(usgsProvisional, false)

      if (this.daily.usgs.length > 0) {
        // console.log(this.daily.usgs.map(d => [(new Date(d.date)).valueOf(), d.mean]))
        this.chart.get('nav-value').setData(this.daily.usgs.map(d => [(new Date(d.date)).valueOf(), d.mean]), false)
      } else {
        this.chart.get('nav-value').setData(meanValues, false)
      }
      this.chart.redraw()
      this.renderMode()
    },
    async renderImages () {
      if (!this.chart) return
      const images = this.daily.images.map(d => ({
        x: (new Date(d.date)).valueOf(),
        y: 1,
        image: d.image
      }))
      this.chart.get('daily-image').setData(images)
      const extremes = this.chart.navigator.yAxis.getExtremes()
      this.chart.get('nav-image').setData(images.map(d => [d.x, extremes.max !== undefined ? extremes.max : 1]))
    },
    async renderNoData () {
      if (this.daily.values.length === 0) {
        this.chart.showNoData()
      } else {
        this.chart.hideNoData()
      }
    },
    async fetchRaw (start, end) {
      const startDate = start.toISOString().substr(0, 10)
      const endDate = end.toISOString().substr(0, 10)
      this.chart.showLoading('Loading data from server...')
      try {
        const images = await this.$http.public
          .get(`/stations/${this.station.id}/images?start=${start.toISOString()}&end=${end.toISOString()}`)
          .then(d => d.data)
        const values = await this.$usgs.getInstantaneousFlows('01171000', startDate, endDate)

        const interpolator = scaleLinear()
          .domain(values.map(d => new Date(d.timestamp).valueOf()))
          .range(values.map(d => d.value))
          .clamp(true)
        images.forEach(d => {
          d.value = interpolator(new Date(d.timestamp).valueOf())
        })

        this.raw.images = images.filter(
          d => new Date(d.timestamp) >= new Date(start) &&
          new Date(d.timestamp) <= new Date(end)
        )
        this.raw.values = values.filter(
          d => new Date(d.timestamp) >= new Date(start) &&
          new Date(d.timestamp) <= new Date(end)
        )
        this.renderRaw()
      } catch (err) {
        console.error(err)
      }
      this.chart.hideLoading()
    },
    async renderRaw () {
      if (!this.chart) return
      const values = this.raw.values.map(d => [(new Date(d.timestamp)).valueOf(), d.value])
      const images = this.raw.images.map(d => ({
        x: (new Date(d.timestamp)).valueOf(),
        y: 1,
        image: d
      }))
      const imageValues = this.raw.images.map(d => ({
        x: (new Date(d.timestamp)).valueOf(),
        y: d.value
      }))
      this.chart.get('raw-value').setData(values)
      this.chart.get('raw-image-value').setData(imageValues)
      this.chart.get('raw-image').setData(images)
    },
    onHover (x) {
      if (this.mode === 'daily') {
        const date = new Date(x).toISOString().substr(0, 10)
        const image = this.daily.images.find(d => d.date === date)
        const value = this.daily.values.find(d => d.date === date)
        if (image) {
          this.hover = {
            date,
            image,
            value
          }
        } else {
          this.hover = null
        }
      } else {
        const image = this.raw.images.find(d => new Date(d.timestamp).valueOf() === x)
        if (image) {
          this.hover = {
            timestamp: image.timestamp,
            image,
            value: image.value
          }
        } else {
          this.hover = null
        }
      }
    }
  }
}
</script>

<style>

</style>
