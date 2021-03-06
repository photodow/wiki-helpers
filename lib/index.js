const fs = require("fs");
const Path = require("path");
let globalOptions, builders, miners;

// TODO: global option booleans not exactly working
// TODO: ignore list
// TODO: custom miners, builders ... miners=./lib/mine.js builders=./lib/build.js done=./lib/done.js
// TODO: Run individual actions ... action=reset,usedby,backlinks,toc
// TODO: Collect [[Card]] and [Card](/Card) [Card](https://Card)

exports.build = build;

function build(config) {
    globalOptions = setGlobalOptions(config);
    builders = setBuilders();
    miners = setMiners();

    findFiles(globalOptions.rootPath)
        .then(storeFileData)
        .then(readFilesOnce)
        .then(updateMarkdown)
        .then(writeEachFileOnce)
        .then(itIsFinished);
}

function setGlobalOptions(config = {}) {
    const arguments = { ...config
    };

    if (process && process.argv) {
        process.argv.slice(2).map(arg => {
            arg = arg.split('=');
            arguments[arg[0]] = arg[1];
        });
    }

    return {
        rootPath: arguments.rootPath || './',
        resetOnly: arguments.resetOnly || false,
        templatePath: arguments.templatePath || undefined,
        depsTitleHook: arguments.depsTitleHook || 'Dependencies',
        buildPath: arguments.buildPath || './build',
        flattenDir: arguments.flattenDir || false
    };
}

function setBuilders() {
    const builders = [
        usedby,
        backlinks,
        category,
        dependencyCount,
        toc,
        categories
    ];

    return builders;
}

function setMiners() {
    const miners = [
        // reset needs to be first to reset everything.
        // reset may not be needed if we manipulate copied files into wiki from repo instead,
        reset
    ];

    if (globalOptions.resetOnly) {
        return miners;
    }

    return miners.concat([
        collectDependencies,
        getBacklinks
    ]);
}

function itIsFinished(count) {
    plural = count === 1 ? '' : 's';

    console.log(`Finished processing ${count} file${plural}`);
}

function dependencyCount(fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;

    if (tester.test(str) && fileObj.dependencies) {
        fileObj.content.updated = replaceContent(fileObj.content.updated, prefix, fileObj.dependencies.length, false);
    }
}

function category(fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;

    if (tester.test(str) && fileObj.type) {
        fileObj.content.updated = replaceContent(fileObj.content.updated, prefix, '`' + fileObj.type + '`');
    }
}

function categories(fileObj, filesObj, prefix) {
    const keys = Object.keys(filesObj).sort();
    const categories = {};

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const file = filesObj[key];
        const type = file.type;

        if (!categories[type]) {
            categories[type] = [];
        }

        categories[type].push(file.title);
    }

    const categoryKeys = Object.keys(categories).sort();

    if (categoryKeys.length) {
        const tester = startEndRegex(prefix);
        let str = fileObj.content.updated;

        if (tester.test(str)) {
            str = replaceContent(str, prefix, function () {
                let html = '';

                for (let i = 0; i < categoryKeys.length; i++) {
                    categoryKey = categoryKeys[i];
                
                    if (categoryKey) {
                        const config = parseConfig(arguments[2]);
                        config.group = config.group ? config.group.split(/, ?/g) : [];
                        
                        if (config.group.indexOf(categoryKey) > -1) {
                            let list = '';
                    
                            config.title = config.title || categoryKey;
                            config.count = categories[categoryKey].length;
                            config.open = config.open || true;
                            config.reduce = config.reduce || true;
                            // config.ignoreList = config.ignoreList || [];
                    
                            categories[categoryKey].forEach(fileTitle => {
                                list += `- [[ ${fileTitle} ]]\n`;
                            });
                    
                            if (list.length) {
                                html += sectionTemplate(config, list);
                            }
                        }
                    }
                }
                
                return html;
            });

            fileObj.content.updated = str;
        }
    }
}

function reset(fileObj, filesObj) {

    builders.forEach(builder => {
        fileObj.content.updated = replaceContent(fileObj.content.updated, builder.name, '', false);
    });

    return Promise.resolve(filesObj);
}

function backlinks (fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;

    if (tester.test(str) && fileObj.backlinks) {
        const keys = Object.keys(fileObj.backlinks).sort();
        const fileTitleRegex = new RegExp(`\\[\\[(?: )?${fileObj.title}(?: )?\\]\\]`, 'g');
        let list = '';
        let totalCount = 0;

        keys.forEach(key => {
            if (fileObj.name !== key) {
                let count = 0;
                let backlinkList = '';

                fileObj.backlinks[key].lines = [...new Set(fileObj.backlinks[key].lines)];

                fileObj.backlinks[key].lines.forEach(line => {
                    const lines = line.trim().split(fileTitleRegex);

                    count += lines.length - 1;
                    totalCount += lines.length - 1;

                    lines.forEach((backlink, i) => {
                        const charCount = 50;

                        if (i < (lines.length - 1)) {
                            let before = backlink.slice(charCount * -1).split(' ');
                            beforeCount = before.shift().length + 1;
                            before = before.join(' ');

                            let after = lines[i + 1].substring(0, charCount).split(' ');
                            let afterCount = after.pop().length + 1;
                            after = after.join(' ');

                            // before = before.length < charCount ? before : '...' + before;
                            // after = after.length < charCount ? after : after + '...';

                            let newLine = `${before}***${fileObj.title}***${after}`.trim();

                            newLine = before.length + beforeCount < charCount ? newLine : '...' + newLine;
                            newLine = after.length + afterCount < charCount ? newLine : newLine + '...';

                            let matchText = encodeURIComponent(newLine.replace(/(\*\*\*|\.\.\.)/g, '').replace(/\s+/g, ' ').replace(/(\[\[|]])/g, ''));

                            backlinkList += `- <a href="${fileObj.backlinks[key].name.replace('.md', '')}#:~:text=${matchText}">${newLine.replace(/(\[\[|]])/g, '')}</a>\n`;
                        }
                    });

                    line = lines.join(`***${fileObj.title}***`);

                });

                list += `\n**[[ ${fileObj.backlinks[key].title} ]]** (${count})\n` + backlinkList;
            }
        });
        
        str = replaceContent(str, prefix, function () {
            let html = '';

            if (list.length) {
                // list = `## References  \n\n${list}  \n\n<br />`;
                const config = parseConfig(arguments[2]);
                config.title = config.title || 'Back links';
                config.open = config.open || false;
                config.count = totalCount;

                html = sectionTemplate(config, list);
            }
            
            return html;
        });

        fileObj.content.updated = str;
    }
}

function usedby(fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;

    if (tester.test(str) && fileObj.usedby.length) {
        let list = '';

        fileObj.usedby = [...new Set(fileObj.usedby)]; // removes duplicates

        fileObj.usedby.forEach(name => {
            list += ` - [[ ${filesObj[name].title} ]]\n`
        });

        str = replaceContent(str, prefix, function () {
            let html = '';

            if (list.length) {
                // list = `## Used by  \n\n${list}  \n\n<br />`;
                const config = parseConfig(arguments[2]);
                config.title = config.title || 'Used by';
                config.open = config.open || false;
                config.count = fileObj.usedby.length;

                html = sectionTemplate(config, list);
            }
            
            return html;
        });

        fileObj.content.updated = str;
    }
}

function toc(fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;

    if (tester.test(str)) {
        
        const lines = str.match(/.*/gm);
        
        str = replaceContent(str, prefix, function () {
            let html = '';
            const config = parseConfig(arguments[2]);
            const depthEnd = config.depthEnd || 6;
            const depthStart = config.depthStart || 1;
            let list = [];

            if (lines.length) {
                let ignoreBlock = false;
                let min = false;

                lines.forEach(line => {
                    const cleanLine = line.trim();

                    if (cleanLine.indexOf('```') === 0) {
                        ignoreBlock = !ignoreBlock ? true : false;
                    }

                    if (line.indexOf('#') === 0 && !ignoreBlock) {
                        let title = cleanLine.split('# ');
                        const lineDepth = title[0].length;

                        if (lineDepth < depthEnd && (lineDepth + 1) >= depthStart) {

                            min = min === false || lineDepth < min ? lineDepth : min;

                            list.push(title);
                        }
                    }
                });
                
                list = list.map(item => {
                    item[0] = item[0].substring(min);
                    item[0] = item[0].replace(/#/g, '  ');
                    
                    item[1] = item[1].replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1'); // grabs text from [here](url)
                    item[1] = item[1].replace(/<[^>]+>/g, ''); // strips html tags
                    const href = 'user-content-' + item[1].toLowerCase().replace(/\.+/g, '').replace(/\W+/g, ' ').trim().replace(/ /g, '-');

                    item[1] = `[${item[1]}](#${href})\n`;
                    
                    return item.join('- ');
                });
            }

            if (list.length > 1) {
                // list = `###### Table of contents  \n\n${list}  \n\n<br />`;
                config.title = config.title || 'Table of contents';
                config.open = config.open || true;

                html = sectionTemplate(config, list.join(''));
            }
            
            return html;
        });

        fileObj.content.updated = str;
    }
}

function getBacklinks(fileObj, filesObj) {
    const files = Object.keys(filesObj).map(key => {
        return {
            title: filesObj[key].title,
            name: filesObj[key].name
        };
    });

    files.forEach(file => {
        
        // TODO: ignore files option like sidebar is doing here?
        
        if (fileObj.name.indexOf('_Sidebar') === -1) { // ignoring files
            const fileTitleRegex = new RegExp(`\\[\\[( )?${file.title}( )?\\]\\]`, 'gm');

            if (fileTitleRegex.test(fileObj.content.updated)) {
                let ignoringDependencies = false;
                
                lineByLine(fileObj.content.updated, (line, i) => {

                    line = line.trim();

                    if (ignoringDependencies && line.indexOf('-') !== 0) {
                        ignoringDependencies = false;
                    }

                    if (line.indexOf(globalOptions.depsTitleHook) > -1) {
                        ignoringDependencies = true;
                    }

                    if (!ignoringDependencies) {
                        if (fileTitleRegex.test(line)) {
                            if (!filesObj[file.name].backlinks[fileObj.name]) {
                                filesObj[file.name].backlinks[fileObj.name] = {
                                    name: fileObj.name,
                                    title: fileObj.title,
                                    lines: [line]
                                };
                            } else {
                                filesObj[file.name].backlinks[fileObj.name].lines.push(line);
                            }
                        }
                    }
                });
            }
        }
    });
}

function collectDependencies(fileObj, filesObj) {
    let depsFound = false;
    let depsEnd = false;
    const reducedLinesToScan = globalOptions.depsTitleHook + fileObj.content.updated.split(globalOptions.depsTitleHook)[1];

    lineByLine(reducedLinesToScan, (line, i) => {
        line = line.trim();

        if (depsFound) {
            if (line.indexOf('-') !== 0) {
                depsEnd = true;
                return true;
            }

            fileObj.dependencies.push(line);
            let name = line.match(/\[\[(.*)\]\]/);

            if (name) {
                name = name[1].replace(/ /g, '-') + '.md';

                if (filesObj[name]) {
                    filesObj[name].usedby.push(fileObj.name);
                }
            }
        }

        if (line.indexOf(globalOptions.depsTitleHook) > -1 && !depsEnd) {
            depsFound = true;
        }
    });
}

function lineByLine(content, callback) {
    const lines = content.match(/.+/g);

    if (lines && lines.length) {
        for (let i = 0; i < lines.length; i++) {
            if (callback(lines[i], i)) break;
        }
    }
}

function writeEachFileOnce(filesObj) {
    const keys = Object.keys(filesObj);
    const waitForIt = [];
    let count = 0;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const original = filesObj[key].content.original;
        const updated = filesObj[key].content.updated;
        const name = filesObj[key].name;
        const path = Path.join(globalOptions.buildPath, filesObj[key].path.replace(globalOptions.rootPath.replace('./', ''), ''));
        let writeTo = Path.join(path, filesObj[key].name);

        if (original !== updated || globalOptions.buildPath) {

            if (globalOptions.buildPath) {
                fs.mkdirSync(globalOptions.buildPath, {
                    recursive: true
                });

                if (!globalOptions.flattenDir) {
                    fs.mkdirSync(path, {
                        recursive: true
                    });
                }
            }

            if (globalOptions.flattenDir) {
                writeTo = Path.join(globalOptions.buildPath, filesObj[key].name);
            }

            waitForIt.push(new Promise((resolve, reject) => {
                fs.writeFile(writeTo, updated, (err) => {
                    if (err) console.log(err);
                    console.log(`Successfully ${!globalOptions.buildPath ? 'updated' : 'created'} ${writeTo}.`);
                    count += 1;
                    resolve(filesObj);
                });
            }));
        }
    }

    return new Promise((resolve, reject) => {
        Promise.all(waitForIt).then(() => resolve(count));
    });
}

function updateMarkdown(filesObj) {
    const keys = Object.keys(filesObj);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        builders.forEach(builder => {
            builder(filesObj[key], filesObj, builder.name);
        });
    }

    return Promise.resolve(filesObj);
}

function readFilesOnce(filesObj) {
    const keys = Object.keys(filesObj);
    const waitForIt = [];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        waitForIt.push(new Promise((resolve, reject) => {
            fs.readFile(Path.join(filesObj[key].path, filesObj[key].name), (err, data) => {
                if (err) console.log(err);

                const content = data.toString();

                filesObj[key].content.original = content;
                filesObj[key].content.updated = content;

                miners.forEach(miner => miner(filesObj[key], filesObj));

                resolve(filesObj);
            });
        }));
    }

    return new Promise((resolve, reject) => {
        Promise.all(waitForIt).then(() => resolve(filesObj));
    });
}

function findFiles(path) {
    console.log('starting at ' + path);

    if (globalOptions.buildPath && globalOptions.buildPath !== globalOptions.rootPath) {
        fs.rmdirSync(globalOptions.buildPath, {
            recursive: true
        });
    }

    return Promise.resolve(recursiveReaddir(path));
}

function recursiveReaddir(path, fileList = []) {
    const waitForIt = [];
    const ignoreList = ['node_modules', 'README.md', 'build', 'lib'];

    if (path && fs.lstatSync(path).isDirectory()) {
        const files = fs.readdirSync(path).filter(name => (ignoreList.indexOf(name) === -1 && name.indexOf('.') !== 0));

        files.forEach(file => {
            const thisPath = Path.join(path, file);
            if (fs.lstatSync(thisPath).isDirectory()) {
                fileList.concat(recursiveReaddir(thisPath, fileList));
            } else {
                fileList.push(thisPath);
            }
        });
    }

    return fileList;
}

function storeFileData (files) {
    const filesObj = {};

    files = files.filter(name => /.md$/.test(name));

    for (let i = 0; i < files.length; i++) {
        const path = files[i].split('/');
        const name = path.pop();

        filesObj[name] = {};
        filesObj[name].name = name;
        filesObj[name].title = name.replace(/-/g, ' ').split('.');
        filesObj[name].title.pop();
        filesObj[name].title = filesObj[name].title.join('.');
        filesObj[name].usedby = [];
        filesObj[name].dependencies = [];
        filesObj[name].content = {};
        filesObj[name].type = path.join('/').replace(globalOptions.rootPath.replace('./', ''), '').replace(/-/g, ' ').split('.')[0].replace('/', '');
        filesObj[name].path = path.join('/');
        filesObj[name].backlinks = {};

        console.log('Processing ' + Path.join(filesObj[name].path, filesObj[name].name) + ' ----- ' + Path.join(globalOptions.buildPath));
    }

    return Promise.resolve(filesObj);
}

function replaceContent(str, prefix, content, nextLine = true) {
    content = globalOptions.resetOnly ? '' : content;
    nextLine = globalOptions.resetOnly ? false : nextLine;

    return str.replace(startEndRegex(prefix), function (match, p1) {
    
        let getContent;

        if (typeof content === 'function') {
            getContent = content.apply(this, arguments);
        } else {
            getContent = content;
        }

        return contentContainer(prefix, getContent, nextLine).replace(/\$1/g, arguments[1]).replace(/\$4/g, arguments[4]);
    });
}

function startEndRegex(prefix) {
    return new RegExp(`(<!-- ${prefix} start(( {1}\\w+="(?:[^"])*")*) ?-->)[^<]*(<!-- ${prefix} end -->)`, 'g');
}

function contentContainer(prefix, content, nextLine = true) {
    if (nextLine) {
        return `$1\n${content}\n$4`;
    }

    return `$1${content}$4`;
}

function sectionTemplate(config, content) {
    const templatePath = config.templatePath || globalOptions.templatePath;
    globalOptions.template = !globalOptions.template && templatePath ? fs.readFileSync(templatePath).toString() : globalOptions.template;

    config.count = config.count ? ` (${config.count})` : '';
    config.open = String(config.open) === 'true' ? ` open="true"` : '';
    config.reduce = String(config.reduce) === 'true' ? '' : '<br />';
    config.headingLevel = config.headingLevel > 6 ? '#'.repeat(6) : '#'.repeat(config.headingLevel || 5);
    config.content = content;

    if (config.type === 'contentOnly') {
        template = `{{content}}`;
    } else if (globalOptions.template) {
        template = globalOptions.template;
    } else if (config.type === 'titleContent') {
        template = `{{headingLevel}} {{title}} {{count}}{{reduce}}

{{content}}

{{reduce}}`;
    } else {
        template = `<details{{open}}>
  <summary><strong>{{title}}</strong>{{count}}</summary>{{reduce}}

{{content}}

{{reduce}}
</details>`;
    }

    Object.keys(config).forEach(key => {
        const replaceThis = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(replaceThis, config[key]);
    });

    return template;
}

function parseConfig(configStr = '') {
    const configList = configStr.trim().split('" ');
    const configuration = {};

    configList.forEach(config => {
        if (Boolean(config)) {
            config = config.split('=');
            configuration[config[0]] = config[1].replace(/"/g, '');
        }
    })

    return configuration;
}