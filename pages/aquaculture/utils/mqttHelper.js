import mqtt from '../../../utils/mqtt.min.js'; //加载mqtt库
/**
 * @brief 创建并初始化MQTT客户端对象，注册监听功能
 * @param mqttClient 必填。onConnect, onError, OnSuccess, offSuccess选填。分别是连接成功、出错、设备启用成功、关闭成功、收到黄安琪数据（参数cleanData）的回调。
 * @return 无
 */
export function createMqttClient(mqttClient, onConnect, onError, OnSuccess, offSuccess, onReceiveSensorData) {
  return new Promise((resolve, reject) => {
    const deviceInfo = wx.getStorageSync('deviceInfo');
    console.log('deviceInfo', deviceInfo);
    //MQTT连接的配置项
    var options = {
      keepalive: 60, //60s，心跳间隔
      clean: true, //cleanSession不保持持久会话
      protocolVersion: 4, //MQTT v3.1.1
      clientId: deviceInfo.UID,
      connectTimeout: 10000 //超时重连时间
    }
    //初始化mqtt连接
    mqttClient = mqtt.connect('wxs://bemfa.com:9504/wss', options)
    // 连接mqtt服务器
    mqttClient.on('connect', () => {
      console.log('连接服务器成功');
  
    });
  
    mqttClient.subscribe(deviceInfo.deviceCode, (err) => {
      if (!err) {
        console.log('订阅成功');
        onConnect && onConnect();
        resolve(mqttClient);
      } else {
        console.log(err);
      }
    });
  
    mqttClient.on('error', (error) => {
      console.log(error);
      console.log('连接服务器失败');
      onError && onError();
      reject(error);
    })
    mqttClient.on('reconnect', function () {
      console.log('尝试重新连接...')
    })
  
    mqttClient.on('message', (topic, message) => {
      console.log(topic)
      var msg = message.toString()
      if (topic == deviceInfo.deviceCode) {
        if (msg.indexOf("#") != -1) { //如果数据里包含#号，表示获取的是传感器值，因为单片机上传数据的时候用#号进行了包裹
          //如果有#号就进行字符串分割
          var rawData = msg.split("#"); //分割数据，并把分割后的数据放到数组里。
          const cleanData = rawData.filter(item => item !== '');
          onReceiveSensorData && onReceiveSensorData(cleanData);
        } else if (msg == 'onSuccess') {
          OnSuccess && OnSuccess();
        } else if (msg == 'offSuccess') {
          offSuccess && offSuccess();
        }
      }
      console.log('收到消息：' + msg)
    })
  })
}

/**
 * @brief 向指定topic发送消息
 * @param mqttClient,msg。客户端和消息内容。
 * @return 无
 */
export function publishMsg(mqttClient, msg) {
  const deviceInfo = wx.getStorageSync('deviceInfo');
  mqttClient.publish(deviceInfo.pubTopic, msg, () => {
    console.log("成功发送了：", msg);
  })
}

export function endMqttConnect(mqttClient) {
  if(mqttClient) {
    mqttClient.end(false);
    console.log("尝试关闭MQTT连接");
  };
}