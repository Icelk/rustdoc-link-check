const core = require("@actions/core")
// const fs = require("fs/promises")
const childProcess = require("child_process")

function awaitEvent(emitter, ev) {
    return new Promise((resolve, _) => {
        emitter.on(ev, () => resolve())
    })
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function main() {
    // Version debug:
    //
    // Catch: if no file was found, give empty JSON.
    // fs.readFile("package.json")
    // .catch(() => "{}")
    // .then((pkg) => {
    // const json = JSON.parse(pkg.toString())
    // const version = json["version"] ?? "dev"
    // console.log(`Running version ${version}`)
    // })

    let checkPrivate = core.getInput("private")
    // checkPrivate = "true"
    if (checkPrivate != "true" && checkPrivate != "false") {
        core.setFailed("private must either be true or false")
        process.exit(1)
    }

    let args = ["doc", "--no-deps", "--color", "always"]
    if (checkPrivate) {
        args.push("--document-private-items")
    }
    const child = childProcess.spawn("cargo", args, {
        cwd: core.getInput("working-directory"),
    })

    let warningsEmitted = false

    let output = ""
    let lines = ""
    child.stderr.on("data", (data) => {
        data = data.toString()
        lines += data
        let lineIter = lines.split("\n")
        // remove the last.
        lineIter.pop()

        lineIter.forEach((line, index) => {
            // Escape code for the green-ish colour
            // If the line is ok, print it now.
            // Else, add it to the stderr output.
            let green = "\x1B[0m\x1B[0m\x1B[1m\x1B[32m"
            let blue = "\x1B[0m\x1B[0m\x1B[1m\x1B[36m"
            if (!line.startsWith(green) && !line.startsWith(blue)) {
                warningsEmitted = true
                output += line + (index + 1 == lineIter.length ? "" : "\n")
            }
            console.log(line)
            const newLines = lines.substring(lineIter[index].length + 1)
            lines = newLines === undefined ? "" : newLines
        })
    })
    await awaitEvent(child, "close")

    await sleep(50)

    if (output.trim().length != 0 && warningsEmitted) {
        if (output.indexOf("could not find `Cargo.toml`") >= 0) {
            core.setFailed("This isn't a Cargo project.")
        } else {
            core.setFailed("Broken links were found.")
        }
    }
}

try {
    main()
} catch (error) {
    core.setFailed(
        "Unexpected failure. Please report. " + JSON.stringify(error),
    )
}
