import * as core from '@actions/core';
import * as github from '@actions/github';

const getVersion = (version) => {
    const numbers = version.split('.');
    console.log("numbers:", numbers);
    return {
        major: parseInt(numbers[0]),
        minor: parseInt(numbers[1]),
        patch: parseInt(numbers[2]),
        manifestSafeVersionString:
            numbers[0] + "." +
            numbers[1] + "." +
            numbers[2]
    };
}

function run() {
    try {
        const event = github.context.eventName;
        if (event !== "create" && event !== "push"){
            core.setFailed("This action is only meant to be run on create/push");
            return;
        }
        // const refType = github.context.payload.ref_type;
        // if (refType !== "branch"){
        //     core.setFailed("This action is only meant to be run on the creation of a new branch");
        //     return;
        // }

        // Grab the branch version
        const branchName = github.context.payload.ref;
        const regex = new RegExp(/release\/\d{1,2}\.\d{1,2}\.\d{1,2}$/);
        if (branchName.match(regex)){
            const versionString = branchName.split('/')[1];
            const version = getVersion(versionString);
            console.log("version: ", version);
            core.setOutput("major", version.major);
            core.setOutput("minor", version.minor);
            core.setOutput("patch", version.patch);
            core.setOutput("manifestSafeVersionString", version.manifestSafeVersionString);
        }
        else{
            core.info(branchName);
            core.setFailed("the branch name does not match the patter 'release/nn.nn.nn'");
        }
    } catch (error) {
        core.setFailed(error);
    }
}

run();

export default run;