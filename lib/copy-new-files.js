const fs = require("fs");
const Path = require("path");
require('dotenv').config();

const getNewFilesRoot = process.env.getNewFilesRoot;
const moveFilesTo = process.env.moveFilesTo.split(',');
const getNewFiles = process.env.getNewFiles.split(',');
const fsTemplate = fs.readFileSync('./lib/_fs-template.md').toString();

moveFilesTo.forEach((moveTo, i) => {
    copyNewFiles(moveTo, Path.join(getNewFilesRoot, getNewFiles[i]), fsTemplate);
});

function copyNewFiles (dir, path, template) {
    fs.readdir(path, (err, files) => {
        if (err) console.log(err);

        const count = {
            new: 0,
            existing: 0
        };

console.log(files)
        files.forEach((file) => {
            const fileName = dir + '/' + file.replace(/ /g, '-') + '.md';
            
            if (!fs.existsSync(fileName)) {
                count.new++;
                fs.writeFile(fileName, template, (err) => {
                    if (err) console.log(err);
                    console.log(`Successfully added ${fileName}.`);
                });
            } else {
                count.existing++;
            }
        });
        
        console.log(`${dir}:`, `${count.new} new`, `${count.existing} existing`);
    });
}