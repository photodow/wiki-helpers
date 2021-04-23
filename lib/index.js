const fs = require("fs");
const templates = [str => str, generateTableOfContents];


// table of contents 2/3 layers deep
// back links




updateMarkdown(str => {
    templates.forEach(template => {
        str = template(str);
    });

    return str;
});







function generateTableOfContents (str) {
    const prefix = 'table-of-contents';
    const tester = startEndRegex(prefix);
    const depth = 3;

    if (tester.test(str)) {
        const lines = str.match(/.*/gm);
        let list = '###### Table of contents  \n';
        
        if (list.length) {
            lines.forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine.indexOf('#') === 0) {
                   let title = cleanLine.split('# ');
                   
                   title[0] = title[0].substring(2);
                   
                   if (title[0].length < depth) {
                       const href = title[1].trim().toLowerCase().replace(/ /g, '-');
                       title[0] = title[0].replace(/#/g, '  ');
                       title[1] = `[${title[1]}](#${href})\n`;
                       title = title.join('- ');
                       
                       list += title;
                   }
                }
            });
        }

        str = replaceContent(str, prefix, list);
    }
    
    return str;
}







function updateMarkdown (callback) {
    forEachFile(file => {
        fs.readFile(file, function(err, data) {
            const str = data.toString();
            const content = callback(str);

            if (content !== str) {
                fs.writeFile(file, content, (err) => {
                    if (err) console.log(err);
                    console.log(`Successfully updated ${file}.`);
                });
            }
        });
    });
}

function forEachFile (callback) {
    fs.readdir('./', (err, files) => {
        files.filter(fileName => /.md$/.test(fileName)).forEach(file => callback(file));
    });
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
