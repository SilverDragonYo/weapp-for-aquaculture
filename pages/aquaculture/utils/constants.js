
export const DEVICE_STATE_TEXT = {
  connection: {
    1: "未连接",
    2: "连接中",
    3: "已连接",
    4: "连接失败",
    5: "订阅失败"
  },
  oxygenation: {
    1: "未启用",
    2: "启用中",
    3: "已启用",
    4: "启用失败"
  }
};

//echarts图表配置项
export let echartsOption = {
  title: {
    text: '传感器数据监控',
    left: '2%',
    top: '1',
    textStyle: {
      fontWeight: 'bold',
    }
  },
  grid: {
    left: "1%",
    width: "97%",
    containLabel: true,
    top: 45,
    bottom: 60
  },
  tooltip: {
    show: true,
    trigger: 'item',
    shadowColor: 'rgba(233, 233, 233, 0.8)',
    shadowBlur: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    confine: true,
    textStyle: {
      textShadowBlur: 10,
      textShadowColor: 'transparent'
    },
    formatter: (params) => {
      var text = '时间：' + params[0].name;
      for (var i = 0, length = params.length; i < length; i++) {
        if (params[i].seriesName === 'DO') {
          var unit = ' mg/L';
          var seriesName = '溶解氧'
        } else if (params[i].seriesName === 'WT') {
          var unit = ' ℃';
          var seriesName = '水温'
        } else {
          var unit = '';
          var seriesName = 'PH'
        };
        text += '\n' + params[i].marker + seriesName + '：' + (params[i].data === undefined ? '--' : params[i].data + unit);
      }
      return text;
    },
  },
  xAxis: {
    type: 'category',
    boundaryGap: true,
    axisPointer: {
      show: true,

    },
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        type: 'dashed'
      }
    },
  },
  dataZoom: [{
    show: 'true',
    filterMode: 'weakFilter',
    type: 'slider',
    start: 50,
    end: 100
  }],
  series: [{
      name: 'DO',
      type: 'line',
      smooth: false,
    },
    {
      name: 'PH',
      type: 'line',
      smooth: 'false'
    },
    {
      name: 'WT',
      type: 'line',
      smooth: 'false'
    }
  ]
};

export let newEchartsOption = {
  tooltip: echartsOption.tooltip,
  xAxis: echartsOption.xAxis,
  yAxis: echartsOption.yAxis,
  series: echartsOption.series
}