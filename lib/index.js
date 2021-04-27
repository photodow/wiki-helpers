const fs = require("fs");
const Path = require("path");
const templates = [
    usedby,
    backlinks,
    toc
];
const miners = [
    reset, // needs to be first to reset everything. // reset may not be needed if we manipulate copied files into wiki from repo instead,
    collectDependencies,
    getType,
    getBacklinks
];
const componentTypes = ['Layout', 'UI', 'Service', 'Utility'];

// console.log(process.argv.slice(2));
// TODO: npm run toc path=./ template=./lib/_template.md miners=./lib/mine.js builders=./lib/build.js done=./lib/done.js action=reset,usedby,backlinks,toc
// seperate npm commands like reset and build
// TODO: more meaningful commit message
// TODO: pre commits, husky
// TODO: build action and publish
// TODO: custom miners, templates, actions
// TODO: Collect [[Card]] and [Card](Card)

findFiles('./')
  .then(storeFileData)
  .then(readFilesOnce)
  .then(updateMarkdown)
  .then(updateSidebar)
  .then(writeEachFileOnce);
  
  
function updateSidebar (filesObj) {
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
    let html = '';
    
    for (let i = 0; i < categoryKeys.length; i++) {
        categoryKey = categoryKeys[i];
        let list = '';

        categories[categoryKey].forEach(fileTitle => {
            list += `- [[${fileTitle}]]\n`;
        });

        html += sectionTemplate(categoryKey, categories[categoryKey].length, list, true, true);
    }

    fs.readFile(fileName, (err, data) => {
        const newContent = replaceContent(data.toString(), 'types', html);
        fs.writeFile(fileName, newContent, (err) => {
            if (err) console.log(err);
            console.log(`Successfully updated _Sidebar.md.`);
        });
    });
    
    return Promise.resolve(filesObj);
}

function reset (fileObj, filesObj) {
    templates.forEach(template => {
        fileObj.content.updated = replaceContent(fileObj.content.updated, template.name, '');
    });

    return Promise.resolve(filesObj);
}

function backlinks (fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;
    let list = '';
    let totalCount = 0;

    if (tester.test(str) && fileObj.backlinks) {
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
                            
                            let matchText = newLine.replace(/(\*\*\*|\.\.\.)/g, '').replace(/\s+/g, ' ');

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
            
            list = sectionTemplate('References', totalCount, list, false);

            str = replaceContent(str, prefix, list);
        }
    }
    
    fileObj.content.updated = str;
}

function usedby (fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    let str = fileObj.content.updated;
    let list = '';

    if (tester.test(str) && fileObj.usedby.length) {
        fileObj.usedby = [...new Set(fileObj.usedby)]; // removes duplicates

        fileObj.usedby.forEach(name => {
            list += ` - [[${filesObj[name].title}]]\n`
        });
        
        if (list.length) {
            // list = `## Used by  \n\n${list}  \n\n<br />`;
            list = sectionTemplate('Used by', fileObj.usedby.length, list, false);
            str = replaceContent(str, prefix, list);
        }
    }
    
    fileObj.content.updated = str;
}

function toc (fileObj, filesObj, prefix) {
    const tester = startEndRegex(prefix);
    const depth = 3;
    let str = fileObj.content.updated;

    if (tester.test(str)) {
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
            list = sectionTemplate('Table of contents', false, list, true)
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
                
                if (line.toLowerCase().indexOf('dependencies') > -1) {
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
  
function getType (fileObj, filesObj) {
    let regex = new RegExp("^`((" + componentTypes.join('|') + ")( Component)?)`", 'i');
    let type = fileObj.content.updated.match(regex);
    
    if (type) {
        fileObj.type = type[1];
    }
}

function collectDependencies (fileObj, filesObj) {
    let depsFound = false;
    let depsEnd = false;

    lineByLine(fileObj.content.updated, (line, i) => {
        line = line.trim();
        
        if (depsFound) {
            if (line.indexOf('-') !== 0) {
                depsEnd = true;
                return true;
            }

            let name = line.match(/\[\[(.*)\]\]/);
            
            if (name) {
                name = name[1].replace(/ /g, '-') + '.md';

                if (filesObj[name]) {
                    fileObj.dependencies.push(name);
                    filesObj[name].usedby.push(fileObj.name);
                }
            }
        }
        
        if (line.toLowerCase().indexOf('dependencies') > -1 && !depsEnd) {
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

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const original = filesObj[key].content.original;
        const updated = filesObj[key].content.updated;
        const name = filesObj[key].name;
        const path = filesObj[key].path;

        if (original !== updated) {
            fs.writeFile(path, updated, (err) => {
                if (err) console.log(err);
                console.log(`Successfully updated ${name}.`);
            });
        }
    }
}

function updateMarkdown (filesObj) {
    const keys = Object.keys(filesObj);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        templates.forEach(template => {
            template(filesObj[key], filesObj, template.name);
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
    return Promise.resolve(recursiveReaddir(path));
}

function recursiveReaddir (path, fileList = []) {
    const waitForIt = [];
    const ignoreList = ['node_modules'];

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

// TODO: Create type from path?

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

function replaceContent (str, prefix, content) {
    return str.replace(startEndRegex(prefix), contentContainer(prefix, content));
}

function startEndRegex (prefix) {
    return new RegExp(`(<!-- ${prefix} start -->)(.|\n)*(<!-- ${prefix} end -->)`);
}

function contentContainer (prefix, content) {
    return `$1\n${content}\n$3`;
}

function sectionTemplate (title, count, content, open, reduce) {
    count = count ? ` (${count})` : '';
    open = open ? ` open="true"` : '';
    reduce = reduce ? '' : '<br />';

    return `
<details${open}>
  <summary><strong>${title}</strong>${count}</summary>${reduce}

${content}

${reduce}
</details>
`;
}
