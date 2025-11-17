/**
 * @brief 获取并格式化当前时间
 * @param type 字符串，默认为default，即返回所有内容，可以根据需求输入date或者time来返回日期或者时间
 * @return 日期和时间，日期，或时间
 */
export function formatTime(type = "default") {
  let date = new Date();
  let y = date.getFullYear();
  let m = String(date.getMonth() + 1).padStart(2, '0');
  let d = String(date.getDate()).padStart(2, '0');
  let h = String(date.getHours()).padStart(2, '0');
  let min = String(date.getMinutes()).padStart(2, '0');
  let s = String(date.getSeconds()).padStart(2, '0');

  if (type === "date") {
    return `${y}-${m}-${d}`;
  } else if (type === "time") {
    return `${h}:${min}:${s}`;
  } else {
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }
}