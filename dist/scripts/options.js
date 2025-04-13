import * as minimist from "minimist";
const argv = minimist(process.argv.slice(2), {
    string: ["project"],
    alias: {
        project: ["P"],
    },
});
const project = argv && argv.project;
export const options = {
    cwd: project || process.cwd(),
};
