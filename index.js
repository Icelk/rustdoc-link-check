const core = require("@actions/core")
const util = require("util")
const childProcess = require("child_process")
const execFile = util.promisify(childProcess.execFile)

function awaitEvent(emitter, ev) {
    return new Promise((resolve, _) => {
        emitter.on(ev, () => resolve())
    })
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
    let checkPrivate = core.getInput("private")
    checkPrivate = "true"
    if (checkPrivate != "true" && checkPrivate != "false") {
        core.setFailed("private must either be true or false")
        process.exit(1)
    }

    let args = ["doc", "--no-deps", "--color", "always"]
    if (checkPrivate) {
        args.push("--document-private-items")
    }
    let child = childProcess.spawn("cargo", args, { cwd: core.getInput("working-directory") })

    let output = ""
    let lines = ""
    child.stderr.on("data", (data) => {
        data = data.toString()
        lines += data
        let lineIter = data.split("\n")
        // remove the last.
        lineIter.pop()

        lineIter.forEach((line, index) => {
            // Escape code for the green-ish colour
            // If the line is ok, print it now.
            // Else, add it to the stderr output.
            if (line.startsWith("\x1B[0m\x1B[0m\x1B[1m\x1B[32m")) {
                // + 1 for \n
                lines = lineIter.slice(line.length + 1)
                console.log(line)
            } else {
                output += line + (index + 1 == lineIter.length ? "" : "\n")
            }
        })
    })
    await awaitEvent(child, "close")

    await sleep(50)

    let stderr = output

    if (stderr.trim().length != 0) {
        // Add a line of padding.
        console.log()
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
