/* eslint no-console:0 */
"use strict";

var fs   = require("fs"),
    path = require("path"),
    url  = require("url"),
    
    chokidar   = require("chokidar"),
    shell      = require("shelljs"),
    browserify = require("browserify"),
    duration   = require("humanize-duration"),
    jsesc      = require("jsesc"),
    
    server   = require("connect")(),
    ecstatic = require("ecstatic")(process.cwd(), {
        cache       : 0,
        handleError : false
    }),
    builder  = browserify("src/index.js", {
        debug : true
    }),
    
    bundling, bytes, time, done;

function bundle() {
    bundling = true;
    
    builder.bundle(function(err, out) {
        bundling = false;
        
        if(err) {
            console.error(err.toString());
            
            fs.writeFileSync(
                "gen/index.js",
                "document.body.innerHTML = \"<pre style='color: red;'>" + jsesc(err.toString()) + "</pre>\";"
            );
            
            return done && done();
        }

        console.error(bytes.toString(), "bytes written to ./gen/index.js in", duration(time));
        
        fs.writeFileSync("./gen/index.js", out);
        
        if(done) {
            return done();
        }
    });
}

// Make sure icons stay up to date
chokidar.watch("./src/icons.svg").on("all", function(event) {
    if(event !== "add" && event !== "change") {
        return;
    }

    shell.cp("./src/icons.svg", "./gen/icons.svg");
});

// Browserify plugins
builder.plugin("watchify");
builder.plugin("modular-css/browserify", {
    css : "gen/index.css",
    
    // Plugins
    before : [
        require("postcss-nested")
    ],
    after : [
        require("postcss-import")
    ]
});

// Browserify transforms
builder.transform("detabbify", { global : true });

// Start up watchify
builder.on("update", bundle);

builder.on("bytes", function(b) {
    bytes = b;
});

builder.on("time", function(t) {
    time = t;
});

bundle();

// Log HTTP requests
server.use(require("morgan")("dev"));

// Delay responding to generated file requests until it's done
server.use("/gen/index.js", function(req, res, next) {
    /* eslint consistent-return: 0 */
    if(!bundling) {
        return next();
    }
    
    console.log("Waiting for bundle to finish...");
    
    done = next;
});

// Set up basic ecstatic serving of files
server.use(ecstatic);

// SPA support
server.use(function(req, res, next) {
    var parts = url.parse(req.url);
    
    if(path.extname(parts.pathname)) {
        res.code = 404;

        return next("Unknown file: " + req.url);
    }

    req.url = "/";

    return ecstatic(req, res, next);
});

server.listen(9966);

console.log("Server listening at http://localhost:9966");
