const path = require("path");
const fs = require("fs");
const {replaceRange} = require("./utils");

renderExtension = (template) => {
    const {workdir, extension} = template;
    if (extension) {
        const layout = fs.readFileSync(path.join(workdir, extension.parameter), 'utf-8');
        template.raw = replaceRange(template.raw, extension.offset, extension.length, layout);
        template.extension = null;
    }

    return template;
};

renderBlocks = (template) => {
    const {exportedImplementations, exportedBlocks} = template;

    let indexCompensation = 0;
    exportedBlocks.forEach((block) => {
        const impl = exportedImplementations[block.parameter];
        if (!impl) {
            throw new ReferenceError(`Block '${block.parameter}' is not implemented`)
        }
        template.raw = replaceRange(template.raw, indexCompensation + block.offset, block.length, impl.body);
        indexCompensation += impl.body.length - block.length;
    });

    return template;
};

module.exports = {renderExtension, renderBlocks};
