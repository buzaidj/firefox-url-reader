function sendURL(details) {
    const freshLoad = !!details?.freshLoad;

    const sending = browser.tabs.query({
        active: true,
        currentWindow: true
    });

    sending.then((tabs) => {
        const tab = tabs[0];

        // These are defined in a .gitignore'd config.js file which
        // defines key and endpoint on local storage
        browser.storage.local.get('key').then((result) => {
            const key = result.key;
            browser.storage.local.get('endpoint').then((result) => {
                const endpoint = result.endpoint;
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'key': key,
                    },
                    body: JSON.stringify({ url: tab.url, title: tab.title, freshLoad: freshLoad, tabId: tab.id, favIconUrl: tab.favIconUrl }),
                });
            })
        })
    });
}

browser.webNavigation.onCompleted.addListener(() => sendURL({ freshLoad: true }));

setInterval(sendURL, 6000);