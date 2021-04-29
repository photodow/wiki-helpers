const fs = require("fs");

// copyNewFiles('Utility', '.../Carbon for IBM.com/Utilities');

// from .env files

function copyNewFiles (dir, path) {
    fs.readdir(path, (err, files) => {
        if (err) console.log(err);
        fs.readFile('./lib/_fs-template.md', (err, data) => {
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