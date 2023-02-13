import chromeStorage from "./util/chromeStorage";

chrome.commands.onCommand.addListener(command => {
    chromeStorage.set('command', command);
})
