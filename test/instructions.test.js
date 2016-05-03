/* eslint no-shadow:0 */
"use strict";

var t = require("tap"),
    mq  = require("mithril-query"),
    
    instructions = {};

// Compile code w/ rollup
t.beforeEach(() => require("./lib/rollup")("./src/types/instructions.js", instructions));

t.test("instructions", (t) => {
    t.test("view exists", (t) => {
        t.equal(typeof instructions.view, "function");
        
        t.end();
    });
        
    t.test("view renders", (t) => {
        var out = mq(instructions.view(null, {
                field : {}
            }));
        
        t.ok(out.has("div"));
        
        t.end();
    });
    
    t.test("view renders head", (t) => {
        var out = mq(instructions.view(null, {
                field : {
                    head : "head"
                }
            }));
        
        t.ok(out.has("div > p[class$=head]"));
        t.ok(out.contains("head"));
        
        t.end();
    });
    
    t.test("view renders body", (t) => {
        var out = mq(instructions.view(null, {
                field : {
                    body : "body"
                }
            }));
        
        t.ok(out.contains("body"));
        
        t.end();
    });
    
    t.end();
});
