const fs = require('fs');
const ejs = require('ejs');
const path = require("path");
const {ParsedTemplate, parseExtension, parseImplementations, parseBlocks} = require('./parser');
const {renderBlocks, renderExtension} = require('./renderer');

compile = (input, workdir = null, fileRef = null) => {
    const template = new ParsedTemplate();
    template.raw = input;
    template.file = fileRef ? path.basename(fileRef) : null;
    if (workdir) {
        template.workdir = workdir.startsWith(path.sep) ? workdir : path.join(path.dirname(fs.realpathSync(__filename)), workdir);
    } else {
        template.workdir = fileRef ? (
            fileRef.startsWith(path.sep) ? path.dirname(fileRef) : path.join(path.dirname(fs.realpathSync(__filename)), path.dirname(fileRef))
        ) : path.dirname(fs.realpathSync(__filename));
    }
    while ((template.extension = parseExtension(template)) !== null) {
        renderExtension(template);
    }
    template.exportedImplementations = parseImplementations(template);
    template.exportedBlocks = parseBlocks(template);
    while (template.exportedBlocks.length > 0) {
        renderBlocks(template);
        template.exportedBlocks = parseBlocks(template);
    }

    return {render: (locals) => ejs.render(template.raw, locals)};
};

render = (input, locals, fileRef = null, output = null) => {
    const rendered = compile(input, null, fileRef).render(locals);
    if (output) fs.writeFileSync(output, rendered);

    return rendered;
};

renderFile = (file, locals, output = null) => {
    const input = fs.readFileSync(file, 'utf8');

    return render(input, locals, file, output);
};

module.exports = {compile, render, renderFile};