// pages/aquacultureConfig/aquacultureConfig.js
Page({
  data: {
    deviceInfo: [{
        name: 'deviceCode',
        label: '设备编号',
        placeholder: '请输入设备编号',
        value: '',
      },
      {
        name: 'UID',
        label: 'UID',
        placeholder: '请输入UID',
        value: '',
      },
    ],
    popup: [{
        name: 'fail',
        imgPath: 'https://pic.electro-dragon.site/keqingRefuse.png',
        text: '还没有填完哦~'
      },
      {
        name: 'success',
        imgPath: 'https://pic.electro-dragon.site/keqingSuccess.png',
        text: '保存成功啦~'
      },
      {
        name: 'clearSuccess',
        imgPath: 'https://pic.electro-dragon.site/keqingSuccess.png',
        text: '清除成功啦~'
      }
    ],
    button: [{
      name: 'set',
      type: 'primary',
      text: '保 存'
    },
    {
      name: 'clear',
      type: 'default',
      text: '清 空'
    }
    ],

    isShowPopup: false,
    currentPopup: null,
  },

  showPopup(currentPopup) {
    const popup = this.data.popup.find(item => item.name === currentPopup);
    this.setData({
      isShowPopup: true,
      currentPopup: popup
    });
    setTimeout(() => {
      this.setData({
        isShowPopup: false
      });
    }, 1500);
  },

  closePopup() {
    this.setData({
      isShowPopup: false
    });
  },

  onDataInput(e) {
    const key = e.currentTarget.dataset.key;
    const index = this.data.deviceInfo.findIndex(item => item.name === key);
    const value = e.detail;
    this.data.deviceInfo[index].value = value;
  },

  onButtonPressed(e) {
    const name = e.currentTarget.dataset.name;
    let data = this.data.deviceInfo.map(item => item.value);
    const isEmpty = data.some(item =>!item || !item.trim());
    data = {'deviceCode': data[0], 'pubTopic': data[0] + 'CTRL','UID': data[1]};
    if(name == 'set') {
      if (isEmpty) {
        this.showPopup('fail');
      } else {
        this.showPopup('success');
        wx.setStorage({
          key: 'deviceInfo',
          data: data,
        });
        console.log("已经成功存入数据", data);
      };
    } else if (name == 'clear') {
      this.showPopup('clearSuccess');
      data = ['', ''];
      const deviceInfo = this.data.deviceInfo;
      for (let i = 0; i < data.length; i++) {deviceInfo[i].value = data[i];};
      this.setData({deviceInfo: deviceInfo});
      data = {'deviceCode': data[0],'UID': data[1]};
      wx.setStorage({
        key: 'deviceInfo',
        data: data,
      })
    }


  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.getStorage({
      key: 'deviceInfo',
      success: (res) => {
        console.log(res.data);
        const deviceInfo = this.data.deviceInfo;
        deviceInfo.forEach(item => {
          if(res.data.hasOwnProperty(item.name)) {
            item.value = res.data[item.name];
          }
        })
        this.setData({
          deviceInfo: deviceInfo
        });
      }
    })

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