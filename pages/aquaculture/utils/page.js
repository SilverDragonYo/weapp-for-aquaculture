/**
 * @brief 计算页面body高度
 * @param 无
 * @return 无
 */
export function getBodyHeight() {
  const statusBarHeight = wx.getWindowInfo().statusBarHeight;
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
  const navBarHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;
  const windowHeight = wx.getWindowInfo().windowHeight;
  const bodyHeight = windowHeight - statusBarHeight - navBarHeight - 3;
  return bodyHeight;
}