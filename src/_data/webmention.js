async function getMentions(url) {
    let mentions = [];
    let page = 0;
    let perPage = 100;

    while (true) {
        const results = await fetch(
            `https://webmention.io/api/mentions.jf2?target=${url}&per-page=${perPage}&page=${page}`
        ).then((r) => r.json());

        mentions = mentions.concat(results.children);

        if (results.children.length < perPage) {
            break;
        }

        page++;
    }

    return mentions.sort((a, b) => ((a.published || a['wm-received']) < (b.published || b['wm-received']) ? -1 : 1));
}