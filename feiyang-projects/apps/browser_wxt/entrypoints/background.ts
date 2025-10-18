export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
});

// 当浏览器启动时
browser.runtime.onStartup.addListener(() => {
  openBaiduIfNotExists();
});

// 当插件安装时
browser.runtime.onInstalled.addListener(() => {
  browser.tabs.create({ url: "https://www.baidu.com" });
});

// 检查并打开百度页面的函数
function openBaiduIfNotExists() {
  browser.tabs.query({}, (tabs) => {
    let baiduOpened = false;
    
    tabs.forEach((tab) => {
      if (tab.url?.includes("baidu.com")) {
        baiduOpened = true;
        browser.tabs.update(tab.id!, { active: true });
      }
    });
    
    if (!baiduOpened) {
      browser.tabs.create({ url: "https://www.baidu.com" });
    }
  });
}

