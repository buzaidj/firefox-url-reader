// Should we be locking critical sections?
const fs = require('fs');

let urlStack = []; // stack of {url, tabId, addTime, activeTime, info}
let N = 50; // number of times at top to stop considering a tab active, this is about 5 minutes considering browser sends a request every 6 secs
let historyList = []; // list of {url, addTime, info}
const msTillMoveToHistory = 20 * 60 * 1000;

let topOfStackAndTimes = {
    url: null,
    tabId: null,
    timesAtTop: 0,
}

function reverseFindIndex(array, condition) {
    let foundIdx;
    for (let i = array.length - 1; i >= 0; i--) {
        if (condition(array[i])) {
            foundIdx = i;
            break;
        }
    }

    return foundIdx;
}

function onRequest({ tabId, url, freshLoad, tabInfo, reqTime }) {
    if (topOfStackAndTimes.tabId === tabId && topOfStackAndTimes.url === url && topOfStackAndTimes.timesAtTop >= N) {
        if (freshLoad) {
            topOfStackAndTimes.timesAtTop = 1;
        }
        return;
    }

    const indexOfMatch = reverseFindIndex(urlStack, elem => (elem.url === url && elem.tabId === tabId));

    if (indexOfMatch === undefined) {
        urlStack.push({
            tabId,
            url,
            tabInfo,
            addTime: reqTime,
            activeTime: reqTime,
            numTimesSeen: 1,
        });

        topOfStackAndTimes = {
            url,
            tabId,
            timesAtTop: 1,
        }

        return;
    }

    if (topOfStackAndTimes.tabId === tabId && topOfStackAndTimes.url === url) {
        const formerTimesAtTop = topOfStackAndTimes.timesAtTop;
        topOfStackAndTimes = {
            tabId,
            url,
            timesAtTop: formerTimesAtTop + 1,
        }
    } else {
        topOfStackAndTimes = {
            tabId,
            url,
            timesAtTop: 1,
        }
    }


    // move whatevers at indexOfMatch to the top of the stack
    const itemToPushToBack = urlStack.splice(indexOfMatch, 1)[0];
    urlStack.push(itemToPushToBack);

    // update it's properties, specifically tabInfo, activeTime
    const itemPushedBack = urlStack[urlStack.length - 1];

    const oldFavIconUrl = itemPushedBack.tabInfo.favIconUrl;
    itemPushedBack.tabInfo = tabInfo;
    // sometimes this dissapears on a refresh
    if (!itemPushedBack.tabInfo.favIconUrl) {
        itemPushedBack.tabInfo.favIconUrl = oldFavIconUrl;
    }
    itemPushedBack.activeTime = reqTime;
    itemPushedBack.numTimesSeen += 1;
}

function getActiveAndRecentPagesForClient() {
    const isLive = urlStack.length > 0;

    // Eventually history will be moved to disk and this will be broken down
    // into two parts
    const urlHistory = [...urlStack].reverse().concat([...historyList].reverse());

    return {
        isLive,
        urlHistory,
    }
}

// Sorta assumes we'll hit N before reaching records old enough
function moveInactiveStuffToHistory() {
    if (global.verboseMode)
        console.log('state of active pool', urlStack.map(x => x.url), historyList.map(x => x.url), topOfStackAndTimes);
    const twentyMinsAgo = new Date(Date.now() - msTillMoveToHistory);
    const { recent, old } = urlStack.reduce((acc, item, idx) => {
        if (item.activeTime >= twentyMinsAgo) {
            acc.recent.push(item);
        } else {
            if (idx === urlStack.length - 1) {
                timesAtTop = 0;
            }
            acc.old.push(item);
        }

        return acc;
    }, { recent: [], old: [] });

    urlStack = recent
    historyList = historyList.concat(old);
}


module.exports = {
    onRequest,
    getActiveAndRecentPagesForClient,
    moveInactiveStuffToHistory,
}