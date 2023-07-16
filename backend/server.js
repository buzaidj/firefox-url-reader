const express = require('express');
const app = express();
const cors = require('cors');

const args = process.argv.slice(2);
const verboseFlagIndex = args.indexOf('--verbose');
const verboseMode = verboseFlagIndex !== -1;

global.verboseMode = verboseMode;

const { onRequest, getActiveAndRecentPagesForClient, moveInactiveStuffToHistory } = require('./active_url_pool.js');
const { isUrlInWhiteList, sanitizeUrl } = require('./url_whitelist_and_sanitize.js');
const { doesKeyMatch } = require('./config.js');

app.use(express.json({ limit: '10mb' }));
app.use(cors());

app.post('/send-url', (req, res) => {
    if (global.verboseMode) console.log(req.body.url, req.body.title);

    const key = req.headers.key;
    if (!doesKeyMatch(key)) {
        console.error('keys dont match! forbidden!');
        res.sendStatus(403);
        return;
    }


    if (!isUrlInWhiteList(req.body.url)) {
        if (global.verboseMode) console.log('return early, url not whitelist');
        res.sendStatus(200);
        return;
    }

    const sanitizedUrl = sanitizeUrl(req.body.url);

    onRequest({
        tabId: req.body.tabId,
        url: sanitizedUrl,
        freshLoad: req.body.freshLoad,
        tabInfo: { title: req.body.title, favIconUrl: req.body.favIconUrl },
        reqTime: new Date()
    })
    res.sendStatus(200);
});

app.get('/browsing', (req, res) => {
    const { isLive, urlHistory } = getActiveAndRecentPagesForClient();

    const liveTab = isLive && urlHistory[0];
    const recentBrowsing = (isLive ? urlHistory.slice(1) : urlHistory).slice(0, 50);

    if (global.verboseMode)
        console.log('request!', isLive, liveTab.url, recentBrowsing.map(x => x.url));

    res.json({ isLive, liveTab, recentBrowsing })
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// The idea here is that eventually history will be moved to disk
setInterval(moveInactiveStuffToHistory, 3000);

