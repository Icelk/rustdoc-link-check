const core = require("@actions/core")
const util = require("util")
const childProcess = require("child_process")
const execFile = util.promisify(childProcess.execFile)

async function main() {
    let checkPrivate = core.getInput("private")
    if (checkPrivate != "true" && checkPrivate != "false") {
        core.setFailed("private must either be true or false")
    }

    let args = ["doc", "--no-deps", "--quiet"]
    if (checkPrivate) {
        args.push("--document-private-items")
    }
    let result = await execFile("cargo", args, { cwd: core.getInput("working-directory") }).catch((test) => {
        return test
    })
    let stderr = result.stderr

    if (stderr.trim().length != 0) {
        console.error(stderr)
        if (stderr.indexOf("could not find `Cargo.toml`") >= 0) {
            core.setFailed("This isn't a Cargo project.")
        } else {
            core.setFailed("Broken links were found.")
        }
    }
}

try {
    main()
} catch (error) {
    core.setFailed("Unexpected failiure. Please report. " + JSON.stringify(error))
}
