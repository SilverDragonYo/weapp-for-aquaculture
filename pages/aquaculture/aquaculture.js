// pages/aquaculture/aquaculture.js
import * as echarts from '../../components/ec-canvas/echarts';
import '../../miniprogram_npm/@vant/weapp/mixins/transition';
import {
  saveDataToStorage
} from './utils/storageHelper'
import {
  formatTime
} from './utils/timeHelper'
import {
  DEVICE_STATE_TEXT,
  echartsOption,
  newEchartsOption
} from './utils/constants'
import {
  createMqttClient,
  publishMsg,
  endMqttConnect
} from './utils/mqttHelper'
import {getBodyHeight} from './utils/page'

/**
 * @brief echart图表初始化函数
 * @param canvas, width, height, dpr
 * @return chart对象
 */
function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr, // new
  });
  canvas.setChart(chart);
  var option = echartsOption;
  chart.setOption(option);

  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  currentPage.chart = chart;

  return chart;
}

Page({
  data: {
    dropDownItemOption: [{
      text: "实时状态",
      value: 0,
      icon: ""
    }],

    deviceState: {
      connection: {
        text: '设备链接状态：', //显示在最前面的文字
        name: 'connection', //状态代号
        state: "未连接", //初始状态
        color: '#FF6A6A', //字体颜色
        buttonText: '连接', //按钮文字
        success: false //成功启用/连接的标志位
      },
      oxygenation: {
        text: '增氧设备状态：',
        name: 'oxygenation',
        state: "未启用",
        color: '#FF6A6A',
        buttonText: '启用',
        success: false,
      }
    },
    popup: [{
        name: 'noSettings',
        imgPath: 'https://pic.electro-dragon.site/keqingRefuse.png',
        text: '未配置设备信息,无法连接设备' + '\n' + '请下拉前往配置项设置'
      },
      {
        name: 'notConnecting',
        imgPath: 'https://pic.electro-dragon.site/keqingRefuse.png',
        text: '未连接设备,无法启用' + '\n' + '请先连接设备再尝试'
      }
    ],
    // 一些变量
    mqttClient: null, 
    enableScroll: true,
    dropDownMenuInitialValue: 0,
    isRealtimeRender: true, //是否实时渲染新数据
    isRealtimeData: false,  
    bodyHeight: 0,  //页面高度
    dataList: [], //传感器数据数组
    isDeviceLaunched: null,
    isMqttConnected: null,

    ec1: {
      onInit: initChart
    },

    sensorData: [{
        name: "PH",
        value: 0,
      },
      {
        name: "溶解氧(mg/L)",
        value: 0,
      },
      {
        name: "水温(℃)",
        value: 0,
      }
    ],

    otherPages: [{
        name: '功能介绍及使用说明',
        target: '/pages/aquacultureIntro/aquacultureIntro'
      },
      {
        name: '配置项',
        target: '/pages/aquacultureConfig/aquacultureConfig'
      }
    ]

  },

  // 转换字符串为number类型
  toNumbers(value) {
    if (Array.isArray(value)) {
      return value.map(v => this.toNumbers(v));
    }
    return Number(value);
  },

  showPopup(currentPopup) {
    const popup = this.data.popup.find(item => item.name === currentPopup);
    this.setData({
      isShowPopup: true,
      currentPopup: popup
    });
  },

  closePopup() {
    this.setData({
      isShowPopup: false
    });
  },

  isDeviceInfoEmpty() {
    let isEmpty = false;
    let data = wx.getStorageSync('deviceInfo');
    if(data) {
      isEmpty = Object.values(data).some(item => !item || !item.trim());
      if (isEmpty) {
        this.showPopup('noSettings');
      }
    } else {
      this.showPopup('noSettings');
      isEmpty = true;
    }

    console.log(isEmpty);
    return isEmpty;
  },

  /**
   * @brief 监听按钮按下，针对不同按钮做相应的处理
   * @param 无
   * @return 无
   */
  onButtonPressed(e) {
    const name = e.currentTarget.dataset.name;
    if (name == 'connection' && !this.isDeviceInfoEmpty()) {
      this.mqttConnect(this.data.mqttClient);
      this.data.isMqttConnected = setTimeout(() => {
        if (!this.data.deviceState.connection.success) {
          this.setDeviceState('connection', 4);
        }
      }, 5000);
    } else if (name == 'oxygenation') {
      if (!this.data.deviceState.connection.success) {
        this.showPopup('notConnecting');
      } else {
        if (!this.data.deviceState.oxygenation.success) {
          publishMsg(this.data.mqttClient, 'on');
          this.setDeviceState('oxygenation', 2);
          this.data.deviceState.oxygenation.starting = true;
          this.data.isDeviceLaunched = setTimeout(() => {
            if (!this.data.deviceState.oxygenation.success) {
              this.setDeviceState('oxygenation', 4);
            }
          }, 5000);
        } else {
          publishMsg(this.data.mqttClient, 'off');
          this.data.deviceState.oxygenation.starting = false;
        }
      }
    }
  },

  /**
   * @brief 设备状态管理器。负责显示设备状态和对应颜色。
   * @param 设备名和序号 optionName就是connection和oxygenation二选一，分别表示连接状态和增氧设备状态。
   *         1是未连接，2是连接中/启用中，3是已连接/已启用，4是连接失败/启用失败
   * @return 无
   */
  setDeviceState(optionName, stateIndex) {
    const fontColor = ['#FF6A6A', '#ffe878', '#66CDAA', '#FF6A6A']; //红黄蓝红四种颜色，适配四个状态
    const text = DEVICE_STATE_TEXT[optionName][stateIndex] || '未知状态，请重试';
    let deviceState = this.data.deviceState;
    deviceState[optionName].state = text;
    deviceState[optionName].color = fontColor[stateIndex - 1];
    if (stateIndex == 3) {
      if (optionName == 'connection') {
        deviceState[optionName].buttonText = '重连'
      } else {
        deviceState[optionName].buttonText = '关闭'
      }

    } else if (stateIndex == 1) {
      if (optionName == 'connection') {
        deviceState[optionName].buttonText = '连接';
      } else {
        deviceState[optionName].buttonText = '启用'
      }
    }
    this.setData({
      deviceState: deviceState
    })
  },

  /**
   * @brief 更新传感器值（既可以处理实时刷新的数据，也可以处理历史数据）
   * @param 传感器数值，时间，是否为实时数据，是否重置图表，是否在图标上显示数据
   * @return 无
   */
  updateSensorData(value, time, isRealtimeData, isRedrawEchart, isSetOption) {
    const sensors = ['DO', 'PH', 'WT'];
    value = this.toNumbers(value);

    if (!Array.isArray(value[0])) {
      value = [
        [value]
      ];
    };

    const valuesMap = {
      PH: value.map(v => v[1]),
      DO: value.map(v => v[0]),
      WT: value.map(v => v[2])
    };
    const series = sensors.map(name => ({
      name: name,
      data: valuesMap[name],
    }));

    if (isRedrawEchart) {
      this.redrawEchart()
    };
    if (isSetOption) {
      this.chart.setOption({
        xAxis: {
          data: time
        },
        series
      });
    };
    if (isRealtimeData) {
      this.setData({
        'sensorData[0].value': valuesMap.PH[valuesMap.PH.length - 1] + '',
        'sensorData[1].value': valuesMap.DO[valuesMap.DO.length - 1] + '',
        'sensorData[2].value': valuesMap.WT[valuesMap.WT.length - 1] + '',
      })
    };
  },

  //重新绘制部分图表组件，以刷新axisPointer，防止未定义报错
  redrawEchart() {
    var option = newEchartsOption;
    this.chart.setOption(option, {
      replaceMerge: ['xAxis', 'yAxis', 'series', 'tooltip']
    });
  },

  /**
   * @brief 监听下拉菜单打开，禁止滚动
   * @param 无 无
   * @return 无
   */
  openDropdown() {
    this.setData({
      enableScroll: false
    });
  },

  /**
   * @brief 监听下拉菜单关闭，允许滚动
   * @param 无 无
   * @return 无
   */
  closeDropdown() {
    this.setData({
      enableScroll: true
    });
  },

  /**
   * @brief 处理下拉菜单选项切换事件
   * @param 无
   * @return 无
   */
  onOptionChange(e) {
    const selectedOption = this.data.dropDownItemOption.find(item => item.value === e.detail)
    const selectedKey = selectedOption ? selectedOption.text : null;

    if (e.detail == 0) {
      this.redrawEchart();
      this.data.isRealtimeRender = true;
    } else {
      this.data.isRealtimeRender = false;
      wx.getStorage({
        key: selectedKey,
        success: (res) => {
          console.log("成功获取对应的value:", res.data);
          const times = res.data.map(item => item[0]);
          const value = res.data.map(item => item[1]); //注意此时是数组
          this.updateSensorData(value, times, false, true, true);
        }
      })
    }
  },

  /**
   * @brief 用来指向其他页面并打开。
   * @param 当前绑定的data-target
   * @return 无
   */
  toOtherPages(e) {
    const target = e.currentTarget.dataset.target;
    console.log(target);
    if (target) {
      wx.navigateTo({
        url: target,
      })
    }
  },

  /**
   * @brief MQTT连接，并对监听到的各种事件做处理
   * @param 无
   * @return 无
   */
  async mqttConnect() {
    if (!this.isDeviceInfoEmpty()) {
      this.setDeviceState('connection', 2);
      this.data.mqttClient = await createMqttClient(this.data.mqttClient,
        () => {
          this.data.deviceState.connection.success = true;
          this.setDeviceState('connection', 3);
          clearTimeout(this.data.isMqttConnected);
        },
        () => {
          this.data.deviceState.connection.success = false;
          this.setDeviceState('connection', 4);
        },
        () => {
          this.data.deviceState.oxygenation.success = true;
          this.setDeviceState('oxygenation', 3);
          clearTimeout(this.data.isDeviceLaunched);
        },
        () => {
          this.data.deviceState.oxygenation.success = false;
          this.setDeviceState('oxygenation', 1);
        },
        (data) => {
          this.pushCurrentData(data);
        },
      ).catch(err => {
        console.error(err)
      });
    }
  },

  /**
   * @brief 自动生成格式化时间，执行图表和sensorData卡片数据更新
   * @param value。数据，是由3种传感器值构成的一维数组，顺序是氧含量、pH、水温
   * @return 无
   */
  pushCurrentData(value) {
    let currentTime = formatTime("time");
    this.data.dataList.push([currentTime, value]);
    const times = this.data.dataList.map(item => item[0]);
    value = this.data.dataList.map(item => item[1]);
    console.log("isRealtimeRender：", this.data.isRealtimeRender);
    if (this.data.isRealtimeRender) {
      this.updateSensorData(value, times, true, false, true);
      console.log("开始刷新数字并渲染图表");
    } else {
      this.updateSensorData(value, times, true, false, false);
      console.log("开始刷新数字，不渲染图表");
    };
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const bodyHeight = getBodyHeight();
    this.setData({ bodyHeight });
    wx.getStorageInfo({
      success: (res) => {
        console.log("成功读取缓存信息");
        const dateKeys = (res.keys || []).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
        const baseLength = this.data.dropDownItemOption.length;
        console.log(dateKeys);
        dateKeys.sort((a, b) => b.localeCompare(a));
        const opts = dateKeys.map((k, idx) => ({
          text: k,
          value: baseLength + idx,
          icon: ""
        }));
        this.setData({
          dropDownItemOption: [...this.data.dropDownItemOption, ...opts]
        });
        console.log(this.data.dropDownItemOption);
      },
      fail: (res) => {
        console.log("未能成功读取");
      },
      complete: (res) => {},
    })
    this.isDeviceInfoEmpty();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.data.isRealtimeRender = false;
    endMqttConnect(this.data.mqttClient);
    saveDataToStorage(this.data.dataList);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})