module.exports = {
  data () {
    return {
      refresher: {
        loading: false,
        timer: null,
        delay: 5000
      }
    }
  },
  beforeDestroy () {
    this.clearRefresh()
  },
  methods: {
    clearRefresh () {
      if (this.refresher.timer) {
        clearTimeout(this.refresher.timer)
        this.refresher.timer = null
      }
    },
    queueRefresh (delay) {
      this.refresher.timer = setTimeout(() => {
        this.refresh()
      }, delay || this.refresher.delay)
    }
  }
}
