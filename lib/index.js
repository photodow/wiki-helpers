const fs = require("fs");
const Path = require("path");
const globalOptions = setGlobalOptions();
const builders = setBuilders();
const miners = setMiners();

// TODO: build action and publish
// TODO: Publish action
// TODO: Publish npm
// TODO: overwrite files vs. copy into new folder/repo
// TODO: remove sidebar specific, add sidebar and footer
// TODO: ignore list
// TODO: custom miners, builders ... miners=./lib/mine.js builders=./lib/build.js done=./lib/done.js
// TODO: Run individual actions ... action=reset,usedby,backlinks,toc
// TODO: more meaningful commit message
// TODO: pre commits, husky
// TODO: Collect [[Card]] and [Card](Card)

findFiles(globalOptions.rootPath)
  .then(storeFileData)
  .then(readFilesOnce)
  .then(updateMarkdown)
  .then(updateSidebar)
  .then(writeEachFileOnce)
  .then(itIsFinished);
  
  
function setGlobalOptions () {
    const arguments = {};

    process.argv.slice(2).map(arg => {
        arg = arg.split('=');
        arguments[arg[0]] = arg[1];
    });

    return {
        rootPath: arguments.path || './',
        sidebar: arguments.sidebar === 'false' ? false : true,
        resetOnly: arguments.resetOnly || false,
        templatePath: arguments.templatePath || undefined,
        depsTitleHook: arguments.depsTitleHook || 'Dependencies',
        buildPath: arguments.buildPath || ''
    };
}

function setBuilders () {
    return [
        usedby,
        backlinks,
        category,
        toc,
        dependencyCount
    ];
}

function setMiners () {
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

function itIsFinished (count) {
    count = globalOptions.sidebar ? count + 1 : count;
    plural = count === 1 ? '' : 's';

    console.log(`Finished processing ${count} file${plural}`);
}

function dependencyCount (fileObj, filesObj, prefix) {
  const tester = startEndRegex(prefix);
  let str = fileObj.content.updated;

  if (tester.test(str) && fileObj.dependencies) {
      fileObj.content.updated = replaceContent(fileObj.content.updated, prefix, fileObj.dependencies.length, false);
  }
}

function category (fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;

    if (tester.test(str) && fileObj.type) {
        fileObj.content.updated = replaceContent(fileObj.content.updated, prefix, '`' + fileObj.type + '`');
    }
}
  
function updateSidebar (filesObj) {
    if (globalOptions.sidebar) {
        const keys = Object.keys(filesObj).sort();
        const categories = {};
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const file = filesObj[key];
            const type = file.type || 'Unclassified';
            
            if (!categories[type]) {
                categories[type] = [];
            }
            
            categories[type].push(file.title);
        }

        const categoryKeys = Object.keys(categories).sort();
        const fileName = '_Sidebar.md';
        const prefix = 'categories';
        
        if (categoryKeys.length) {
            fs.readFile(fileName, (err, data) => {
                const str = data.toString();
                const tester = startEndRegex(prefix);
                const match = str.match(tester);
                let html = '';

                if (match) {
                    for (let i = 0; i < categoryKeys.length; i++) {
                        categoryKey = categoryKeys[i];
                        const config = parseConfig(match[2]);
                        let list = '';
                        
                        config.title = categoryKey;
                        config.count = categories[categoryKey].length;
                        config.open = config.open || true;
                        config.reduce = config.reduce || true;

                        categories[categoryKey].forEach(fileTitle => {
                            list += `- [[${fileTitle}]]\n`;
                        });

                        html += sectionTemplate(config, list);
                    }

                    const newContent = replaceContent(str, prefix, html);
                    fs.writeFile(fileName, newContent, (err) => {
                        if (err) console.log(err);
                        console.log(`Successfully updated _Sidebar.md.`);
                    });
                }
            });
        }
    }
    
    return Promise.resolve(filesObj);
}

function reset (fileObj, filesObj) {
    builders.forEach(builder => {
        fileObj.content.updated = replaceContent(fileObj.content.updated, builder.name, '', false);
    });

    return Promise.resolve(filesObj);
}

function backlinks (fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;
    const match = str.match(tester);
    let list = '';
    let totalCount = 0;

    if (match && fileObj.backlinks) {
        const keys = Object.keys(fileObj.backlinks).sort();
        
        keys.forEach(key => {
            if (fileObj.name !== key) {
                let count = 0;
                let backlinkList = '';

                fileObj.backlinks[key].lines = [...new Set(fileObj.backlinks[key].lines)];

                fileObj.backlinks[key].lines.forEach(line => {
                    const lines = line.trim().split(`[[${fileObj.title}]]`);
                    count += lines.length - 1;
                    totalCount += lines.length - 1;
                    
                    lines.forEach((backlink, i) => {
                        const charCount = 50;

                        if (i < (lines.length - 1)) {
                            let before = backlink.slice(charCount * -1).split(' ');
                            beforeCount = before.shift().length + 1;
                            before = before.join(' ');
                            
                            let after = lines[i+1].substring(0, charCount).split(' ');
                            let afterCount = after.pop().length + 1;
                            after = after.join(' ');
                            
                            // before = before.length < charCount ? before : '...' + before;
                            // after = after.length < charCount ? after : after + '...';
                            
                            let newLine = `${before}***${fileObj.title}***${after}`.trim();
                            
                            newLine = before.length + beforeCount < charCount ? newLine : '...' + newLine;
                            newLine = after.length + afterCount < charCount ? newLine : newLine + '...';
                            
                            let matchText = encodeURIComponent(newLine.replace(/(\*\*\*|\.\.\.)/g, '').replace(/\s+/g, ' '));

                            backlinkList += `- <a href="${fileObj.backlinks[key].name.replace('.md', '')}#:~:text=${matchText}">${newLine.replace(/(\[\[|]])/g, '')}</a>\n`;
                        }
                    });
                
                    line = lines.join(`***${fileObj.title}***`);
                    
                });

                list += `\n**[[${fileObj.backlinks[key].title}]]** (${count})\n` + backlinkList;
            }
        });

        
        if (list.length) {
            // list = `## References  \n\n${list}  \n\n<br />`;
            const config = parseConfig(match[2]);
            config.title = config.title || 'Back links';
            config.open = config.open || false;
            config.count = totalCount;
            
            list = sectionTemplate(config, list);

            str = replaceContent(str, prefix, list);
        }
    }
    
    fileObj.content.updated = str;
}

function usedby (fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;
    let list = '';
    const match = str.match(tester);

    if (match && fileObj.usedby.length) {

        fileObj.usedby = [...new Set(fileObj.usedby)]; // removes duplicates

        fileObj.usedby.forEach(name => {
            list += ` - [[${filesObj[name].title}]]\n`
        });
        
        if (list.length) {
            // list = `## Used by  \n\n${list}  \n\n<br />`;
            const config = parseConfig(match[2]);
            config.title = config.title || 'Used by';
            config.open = config.open || false;
            config.count = fileObj.usedby.length;

            list = sectionTemplate(config, list);
            str = replaceContent(str, prefix, list);
        }
    }
    
    fileObj.content.updated = str;
}

function toc (fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    const depth = 3;
    let str = fileObj.content.updated;
    const match = str.match(tester);

    if (match) {
        const lines = str.match(/.*/gm);
        let list = '';
        
        if (lines.length) {
            lines.forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine.indexOf('#') === 0) {
                   let title = cleanLine.split('# ');
                   
                   title[0] = title[0].substring(2);
                   
                   if (title[0].length < depth) {
                       const href = title[1].trim().toLowerCase().replace(/ /g, '-').replace(/\.|\(|\)/g, '');

                       title[0] = title[0].replace(/#/g, '  ');
                       title[1] = `[${title[1]}](#${href})\n`;
                       title = title.join('- ');
                       
                       list += title;
                   }
                }
            });
        }
        if (list.length) {
            // list = `###### Table of contents  \n\n${list}  \n\n<br />`;
            const config = parseConfig(match[2]);
            config.title = config.title || 'Table of contents';
            config.open = config.open || true;

            list = sectionTemplate(config, list);
            str = replaceContent(str, prefix, list);
        }
    }
    
    fileObj.content.updated = str;
}

function getBacklinks (fileObj, filesObj) {
    const files = Object.keys(filesObj).map(key => {
        return {
            title: filesObj[key].title,
            name: filesObj[key].name
        };
    });
    
    files.forEach(file => {
        if (fileObj.content.updated.indexOf(`[[${file.title}]]`) > -1) {
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
                    if (line.indexOf(`[[${file.title}]]`) > -1) {
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
    });
}

function collectDependencies (fileObj, filesObj) {
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

function lineByLine (content, callback) {
    const lines = content.match(/.+/g);

    if (lines && lines.length) {
        for (let i = 0; i < lines.length; i++) {
            if (callback(lines[i], i)) break;
        }
    }
}

function writeEachFileOnce (filesObj) {
    const keys = Object.keys(filesObj);
    const waitForIt = [];
    let count = 0;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const original = filesObj[key].content.original;
        const updated = filesObj[key].content.updated;
        const name = filesObj[key].name;
        // const path = Path.join(globalOptions.buildPath, filesObj[key].path);
        const path = filesObj[key].path;
            // console.log(filesObj);

        if (original !== updated || globalOptions.buildPath) {
            fs.mkdir('/tmp/a/apple', { recursive: true }, (err) => {
              if (err) throw err;
            });

            waitForIt.push(new Promise((resolve, reject) => {
                fs.writeFile(path, updated, (err) => {
                    if (err) console.log(err);
                    console.log(`Successfully updated ${name}.`);
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

function updateMarkdown (filesObj) {
    const keys = Object.keys(filesObj);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        builders.forEach(builder => {
            builder(filesObj[key], filesObj, builder.name);
        });
    }
    
    return Promise.resolve(filesObj);
}

function readFilesOnce (filesObj) {
    const keys = Object.keys(filesObj);
    const waitForIt = [];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        waitForIt.push(new Promise((resolve, reject) => {
            fs.readFile(filesObj[key].path, (err, data) => {
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

function findFiles (path) {
    console.log('starting at ' + path);
    return Promise.resolve(recursiveReaddir(path));
}

function recursiveReaddir (path, fileList = []) {
    const waitForIt = [];
    const ignoreList = ['node_modules', 'README.md'];

    if (path && fs.lstatSync(path).isDirectory()) {
        const files = fs.readdirSync(path).filter(name => (ignoreList.indexOf(name) === -1 && name.indexOf('.') !== 0 && name.indexOf('_') !== 0));
        
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
    
    files = files.filter(name => /.md$/.test(name) && name.indexOf('_') !== 0);

    for (let i = 0; i < files.length; i++) {
        const path = files[i].split('/');
        const name = path.pop();

        filesObj[name] = {};
        filesObj[name].name = name;
        filesObj[name].title = name.replace(/-/g, ' ').split('.')[0];
        filesObj[name].usedby = [];
        filesObj[name].dependencies = [];
        filesObj[name].content = {};
        filesObj[name].type = path.join('/').replace(/-/g, ' ').split('.')[0];
        filesObj[name].path = Path.join(path.join('/'), name);
        filesObj[name].backlinks = {};
    }

    return Promise.resolve(filesObj);
}

function replaceContent (str, prefix, content, nextLine = true) {
    content = globalOptions.resetOnly ? '' : content;
    nextLine = globalOptions.resetOnly ? false : nextLine;

    return str.replace(startEndRegex(prefix), contentContainer(prefix, content, nextLine));
}

function startEndRegex (prefix) {
    return new RegExp(`(<!-- ${prefix} start ((\\w+="(\\w ?)*" )*)-->)(.|\n)*(<!-- ${prefix} end -->)`);
}

function contentContainer (prefix, content, nextLine = true) {
    if (nextLine) {
      return `$1\n${content}\n$6`;
    }
    
    return `$1${content}$6`;
}

function sectionTemplate (config, content) {
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

function parseConfig (configStr) {
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
