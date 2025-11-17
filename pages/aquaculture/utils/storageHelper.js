import { formatTime } from './timeHelper';

/**
 * @brief 将dataList数组的数据存入以当前日期为key的缓存
 * @param dataList数组 是包含时间和值的二维数组
 * @return 无
 */
export function saveDataToStorage(dataList) {
  let currentDate = formatTime("date");
  const removed = dataList.splice(0, dataList.length);

  wx.getStorage({
    key: currentDate,
    success(res) {
      const oldData = res.data || [];
      const newData = [...oldData, ...removed];
      wx.setStorageSync(currentDate, newData);
      console.log("已有数据，追加新的数据:", newData);
    },
    fail() {
      wx.setStorageSync(currentDate, removed);
      console.log("没有数据，创建key并存入新的数据:", removed);
    }
  })
}