const WHITELISTED_DOMAINS = [
    'arxiv.org/pdf',
    'chat.openai.com',
    // 'google.com/search', // no gmail
    'scholar.google.com',
    'news.ycombinator.com',
    'github.com',
    'huggingface.co',
    'wikipedia.org',
]

const DENYLISTED_DOMAINS = [
    'file:///'
]

function isUrlInWhiteList(url) {
    return WHITELISTED_DOMAINS.some(domain => url.includes(domain)) && !DENYLISTED_DOMAINS.some(domain => url.includes(domain));
}

function sanitizeUrl(url) {
    const withoutQueryParams = url.split('?')[0];
    return withoutQueryParams;
}

module.exports = {
    isUrlInWhiteList,
    sanitizeUrl,
}