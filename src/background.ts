import chromeStorage from "./util/chromeStorage";

chrome.commands.onCommand.addListener(async command => {
    console.log(`Command: ${command}`);
    await chromeStorage.set('command', command);
})
