<template>
  <div>
    <Alert v-if="error" type="error" title="Failed to Retrieve Data">
      {{ error }}
    </Alert>
    <highcharts v-else :options="chartOptions" ref="chart"></highcharts>
  </div>
</template>

<script>
export default {
  name: 'DatasetTimeseriesChart',
  props: ['series', 'timezone'],
  data () {
    return {
      loading: false,
      error: null,
      chartOptions: {
        chart: {
          animation: false,
          zooming: {
            type: 'x'
          },
          height: '300px'
        },
        title: {
          text: null
        },
        plotOptions: {
          series: {
            animation: false
          }
        },
        legend: {
          enabled: false
        },
        tooltip: {
          animation: false,
          xDateFormat: '%b %e, %Y %H:%M:%S'
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: ''
          }
        },
        series: [{
          id: 'series',
          type: 'line',
          data: []
        }]
      }
    }
  },
  mounted () {
    this.init()
  },
  watch: {
    loading () {
      const chart = this.$refs.chart.chart

      if (!chart) return

      if (this.loading) {
        chart.showLoading()
        chart.hideNoData()
      } else {
        chart.hideLoading()
      }
    }
  },
  methods: {
    async init () {
      if (!this.series) return

      const data = await this.fetchData()
      this.updateChart(data)
    },
    async fetchData () {
      this.loading = true
      this.error = null

      try {
        const response = await this.$http.public.get(`/series/${this.series.id}/values`)
        return response.data
      } catch (error) {
        this.error = error.toString()
      } finally {
        this.loading = false
      }
    },
    async updateChart (data) {
      const chart = this.$refs.chart.chart
      if (!chart) return

      const series = chart.get('series')
      const values = data.map(d => [(new Date(d.timestamp)).valueOf(), d.value])
      series.setData(values, false)
      series.update({
        name: this.series.variable.id
      }, false)
      chart.update({
        time: {
          timezone: this.timezone
        }
      }, false)
      chart.yAxis[0].update({
        title: {
          text: this.series.variable.description
        }
      }, false)
      // chart.render()
      chart.redraw()
    }
  }
}
</script>
