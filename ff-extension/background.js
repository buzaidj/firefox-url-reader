function sendURL(details) {
    const freshLoad = !!details?.freshLoad;

    const sending = browser.tabs.query({
        active: true,
        currentWindow: true
    });

    sending.then((tabs) => {
        const tab = tabs[0];

        fetch('http://localhost:3000/send-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: tab.url, title: tab.title, freshLoad: freshLoad, tabId: tab.id, favIconUrl: tab.favIconUrl }),
        });
    });
}

browser.webNavigation.onCompleted.addListener(() => sendURL({ freshLoad: true }));

setInterval(sendURL, 6000);