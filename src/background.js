chrome.browserAction.onClicked.addListener(function(tab) {
  console.log(`Applying filters`);
  chrome.tabs.executeScript({
    code: "[...document.querySelectorAll('table')].forEach(table => new TableFilter(table, { base_path: './' }));"
  });
});
