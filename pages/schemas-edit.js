"use strict";

// Require codemirror extra JS bits and bobs so it works
require("codemirror/mode/javascript/javascript");
require("codemirror/addon/dialog/dialog");
require("codemirror/addon/search/searchcursor");
require("codemirror/addon/search/search");
require("codemirror/addon/search/matchesonscrollbar");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/addon/fold/foldcode");
require("codemirror/addon/fold/foldgutter");
require("codemirror/addon/fold/brace-fold");
require("codemirror/addon/lint/lint");
require("../lib/cm-json-lint");

var m        = require("mithril"),
    assign   = require("lodash.assign"),
    debounce = require("lodash.debounce"),
    Editor   = require("codemirror"),
    traverse = require("traverse"),

    types  = require("../types"),
    db     = require("../lib/firebase"),

    css    = require("./schemas-edit.css");

module.exports = {
    controller : function() {
        var ctrl = this,
            id   = m.route.param("id"),
            ref  = db.child("schemas/" + id);
        
        ctrl.schema = null;
        ctrl.recent = null;

        ref.on("value", function(snap) {
            ctrl.schema = snap.val();
            
            m.redraw();
        });

        // Ensure the updated timestamp is always accurate-ish
        ref.on("child_changed", function(snap) {
            if(snap.key() === "updated") {
                return;
            }

            ref.child("updated").set(db.TIMESTAMP);
        });

        // get 5 latest entries using this type to display
        db.child("content").orderByChild("type").equalTo(id).limitToLast(5).on("value", function(snap) {
            ctrl.recent = snap.val();

            m.redraw();
        });
        
        // Set up codemirror
        ctrl.editorSetup = function(el, init) {
            if(init) {
                return;
            }

            ctrl.editor = Editor.fromTextArea(el, {
                mode : "application/json",
                lint : true,
                
                gutters : [ "CodeMirror-lint-markers", "CodeMirror-foldgutter" ],
                
                lineNumbers  : true,
                indentUnit   : 4,
                lineWrapping : true,
                foldGutter   : true,
                
                autoCloseBrackets : true
            });

            // Respond to editor changes, but debounced. Ensure it fires at least
            // once a second while changes are happening though
            ctrl.editor.on("changes", debounce(ctrl.editorChanged, 100, { maxWait : 1000 }));
        };
        
        // Handle codemirror change events
        ctrl.editorChanged = function() {
            var text = ctrl.editor.doc.getValue(),
                config, priority;

            // Ensure JSON is still valid before applying
            try {
                config = JSON.parse(text);
            } catch(e) {
                return;
            }
            
            // Clear out previous state
            ref.child("fields").remove();
            ref.child("source").set(text);
            
            // Traverse config object, calculate priority at each level
            // so order is maintained (barf barf barf)
            traverse(config).forEach(function(value) {
                if(this.isRoot) {
                    priority = 0;
                    
                    return;
                }
                
                ref.child("fields").child(this.path.join("/")).setWithPriority(
                    this.isLeaf ? value : "placeholder",
                    priority
                );
                
                if(this.notLeaf) {
                    priority = 0;
                } else {
                    priority++;
                }
            });

        };
    },

    view : function(ctrl) {
        if(!ctrl.schema) {
            return m("h1", "Loading...");
        }

        return m("div", { class : css.page.join(" ") },
            m("div", { class : css.meta.join(" ") },
                m("h1", ctrl.schema.name),
                m("h2", "Recent Entries"),
                m("ul",
                    Object.keys(ctrl.recent || {}).map(function(key) {
                        return m("li",
                            m("a", { href : "/content/" + key, config : m.route }, ctrl.recent[key].name)
                        );
                    })
                ),
                m("hr")
            ),
            m("div", { class : css.contents.join(" ") },
                m("div", { class : css.editor.join(" ") },
                    m("textarea", { config : ctrl.editorSetup, },
                        ctrl.schema.source || "{}"
                    )
                ),

                m("div", { class : css.fields.join(" ") },
                    m.component(types.components.fields, { details : ctrl.schema.fields })
                )
            )
        );
    }
};