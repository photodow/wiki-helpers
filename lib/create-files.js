const fs = require("fs");

fs.readFile(fileName, (err, data) => {
    const newContent = replaceContent(data.toString(), 'types', html);
    // fs.writeFile(fileName, newContent, (err) => {
    //     if (err) console.log(err);
    //     console.log(`Successfully updated _Sidebar.md.`);
    // });
});