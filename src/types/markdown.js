"use strict";

var m          = require("mithril"),
    editor     = require("codemirror"),
    Remarkable = require("remarkable"),
    
    id    = require("./lib/id"),
    hide  = require("./lib/hide"),
    label = require("./lib/label"),
    
    css = require("./markdown.css"),

    md = new Remarkable();

require("codemirror/mode/markdown/markdown");

module.exports = {
    controller : function(options) {
        var ctrl = this;
        
        ctrl.id       = id(options);
        ctrl.markdown = options.data || "";
        ctrl.previewing = false;
        ctrl.previewHTML = null;

        ctrl.togglePreview = function(e) {
            e.preventDefault();

            ctrl.previewHTML = md.render(ctrl.markdown);
            ctrl.previewing = !ctrl.previewing;
        };

        ctrl.editorChanged = function() {
            ctrl.markdown = ctrl.editor.doc.getValue();

            options.update(options.path, ctrl.markdown);
        };

        ctrl.editorSetup = function(el, init) {
            if(init) {
                return;
            }

            ctrl.editor = editor.fromTextArea(el, {
                mode : "text/x-markdown",

                indentUnit   : 4,
                lineWrapping : true
            });

            ctrl.editor.on("changes", ctrl.editorChanged);
        };
    },

    view : function(ctrl, options) {
        var hidden  = hide(options);

        if(hidden) {
            return hidden;
        }

        return m("div",
            label(ctrl, options),
            m("div", { class : ctrl.previewing ? css.inputHidden : css.input },
                m("textarea", { config : ctrl.editorSetup },
                    ctrl.markdown
                )
            ),
            m("div", { class : ctrl.previewing ? css.input : css.inputHidden },
                m.trust(ctrl.previewHTML)
            ),
            m("button.pure-button", {
                    onclick : ctrl.togglePreview,
                    class   : css.button
                },
                ctrl.previewing ? "Edit" : "Preview"
            )
        );
    }
};
