const express = require('express');
const app = express();
const cors = require('cors');

const { onRequest, getActiveAndRecentPagesForClient, moveInactiveStuffToHistory } = require('./active_url_pool.js');
const { isUrlInWhiteList, sanitizeUrl } = require('./url_whitelist_and_sanitize.js');

app.use(express.json({ limit: '10mb' }));
app.use(cors());

app.post('/send-url', (req, res) => {
    console.log(req.body.url, req.body.title);
    if (!isUrlInWhiteList(req.body.url)) {
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

    console.log('request!!!');

    res.json({ isLive, liveTab, recentBrowsing })
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// The idea here is that eventually history will be moved to disk
setInterval(moveInactiveStuffToHistory, 3000);

