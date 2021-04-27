const fs = require("fs");

copyNewFiles('UI-component', '/Users/james.dow@us.ibm.com/Box/Carbon for IBM.com/Components/UI components');
copyNewFiles('Layout-component', '/Users/james.dow@us.ibm.com/Box/Carbon for IBM.com/Components/Layout components');
copyNewFiles('Service', '/Users/james.dow@us.ibm.com/Box/Carbon for IBM.com/Services');
copyNewFiles('Utility', '/Users/james.dow@us.ibm.com/Box/Carbon for IBM.com/Utilities');

function copyNewFiles (dir, path) {
    fs.readdir(path, (err, files) => {
        if (err) console.log(err);
        fs.readFile('./lib/_template.md', (err, data) => {
            const template = data.toString();

            files.forEach((file) => {
                const fileName = dir + '/' + file.replace(/ /g, '-') + '.md';
                if (!fs.existsSync(dir + '/' + fileName)) {
                    fs.writeFile(fileName, template, (err) => {
                        if (err) console.log(err);
                        console.log(`Successfully updated ${fileName}.`);
                    });
                }
            });
        });
    });
}