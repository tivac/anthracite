/* eslint no-shadow:0 */
"use strict";

var assert = require("better-assert"),
    query  = require("mithril-query"),
    
    children = {};

describe("Anthracite", () => {
    before(() => require("./lib/rollup")("./src/types/children.js", children));
    
    describe("/types/children", function() {
        var view;
        
        before(() => {
            view = children.exports.view;
        });
        
        it("should exist", () => {
            assert(typeof view === "function");
        });
            
        it("should render", () => {
            var out = query(view(null, {
                    field : {}
                }));
            
            assert(out.has("div"));
        });
        
        it("should render hidden", () => {
            var out = query(view(null, {
                    state : {
                        "fooga" : 7
                    },
                    field : {
                        show : {
                            field : "fooga",
                            value : 7
                        }
                    },
                    data : {},
                    path : "",

                    registerHidden : function() {}
                }));

            assert(out.has(".hidden"));
        });
        
    //     it("should respect options.class", () => {
    //         var out = query(view(null, {
    //                 field : {},
    //                 class : "fooga"
    //             }));
            
    //         assert(out.has(".fooga"));
    //     });
        
    //     it("should render head", () => {
    //         var out = query(view(null, {
    //                 field : {
    //                     head : "head"
    //                 }
    //             }));
            
    //         assert(out.has("div > p[class$=head]"));
    //         assert(out.contains("head"));
    //     });
        
    //     it("should render body", () => {
    //         var out = query(view(null, {
    //                 field : {
    //                     body : "body"
    //                 }
    //             }));
            
    //         assert(out.contains("body"));
    //     });
    });
});
