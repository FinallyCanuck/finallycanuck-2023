const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlmin = require("html-minifier");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
  // Disable automatic use of your .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  // human readable date
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "America/Toronto" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // Webmentions filter
  eleventyConfig.addFilter('webmentionsByUrl', function(webmentions, url) {
    const allowedTypes = ['in-reply-to', 'like-of', 'repost-of']

    const data = {
        'like-of': [],
        'repost-of': [],
        'in-reply-to': [],
    }

    const hasRequiredFields = entry => {
        const { author, published, content } = entry
        return author.name && published && content
    }

    const filtered = webmentions
        .filter(entry => entry['wm-target'] === `https://finallycanuck.com/${url}`)
        .filter(entry => allowedTypes.includes(entry['wm-property']))

    filtered.forEach(m => {
        if (data[m['wm-property']])
        {
            const isReply = m['wm-property'] === 'in-reply-to'
            const isValidReply = isReply && hasRequiredFields(m)
            if (isReply)
            {
                if (isValidReply)
                {
                    m.sanitized = sanitizeHTML(m.content.html)
                    data[m['wm-property']].unshift(m)
                }

                return
            }

            data[m['wm-property']].unshift(m)
        }
    })

    return data
}),
 

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin), {
    baseHref: "https://finallycanuck.com/",
    extensions: "jpg, gif, png",
    filters: {
      base: "htmlBaseUrl",
      html: "transformWithHtmlBase",
      pathPrefix: "addPathPrefixToUrl",
    },
  };

  eleventyConfig.setServerOptions({
    // Default values are shown:

    // Whether the live reload snippet is used
    liveReload: true,

    // Whether DOM diffing updates are applied where possible instead of page reloads
    domDiff: true,

    // The starting port number
    // Will increment up to (configurable) 10 times if a port is already in use.
    port: 8080,

    // Additional files to watch that will trigger server updates
    // Accepts an Array of file paths or globs (passed to `chokidar.watch`).
    // Works great with a separate bundler writing files to your output folder.
    // e.g. `watch: ["_site/**/*.css"]`
    watch: [],

    // Show local network IP addresses for device testing
    showAllHosts: true,

    // Use a local key/certificate to opt-in to local HTTP/2 with https
    https: {
      // key: "./localhost.key",
      // cert: "./localhost.cert",
    },

    // Change the default file encoding for reading/serving files
    encoding: "utf-8",

    // Show the dev server version number on the command line
    showVersion: false,
  });

  // Copy Static Files to /_Site
  eleventyConfig.addPassthroughCopy({
    "./src/admin/config.yml": "./admin/config.yml",
    "./node_modules/alpinejs/dist/cdn.min.js": "./static/js/alpine.js",
    "./node_modules/prismjs/themes/prism-tomorrow.css":
      "./static/css/prism-tomorrow.css",
  });

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/img");

  // Copy manifest to route of /_site
  eleventyConfig.addPassthroughCopy("./src/static/manifest.json");

  // Copy favicon to route of /_site
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");
  
  // Adds RSS feed
  eleventyConfig.addPlugin(pluginRss);

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }

    return content;
  });

  // Let Eleventy transform HTML files as nunjucks
  // So that we can use .html instead of .njk
  return {
    dir: {
      input: "src",
    },
    htmlTemplateEngine: "njk",
  };
};
