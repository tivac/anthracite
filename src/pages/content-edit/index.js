import m from "mithril";

import sluggo from "sluggo";
import get from "lodash.get";
import merge from "lodash.merge";
import assign from "lodash.assign";
import capitalize from "lodash.capitalize";

import db from "../../lib/firebase.js";
import watch from "../../lib/watch.js";
import prefix from "../../lib/prefix.js";

import * as layout from "../layout/index.js";
import * as head from "./head.js";
import * as formView from "./form.js";

import Content from "./content-state.js";

import css from "./form.css";

export function controller() {
    var ctrl = this,

        id     = m.route.param("id"),
        schema = db.child("schemas/" + m.route.param("schema")),
        ref    = db.child("content/" + m.route.param("schema") + "/" + id),

        content;

    ctrl.id     = id;
    ctrl.ref    = ref;
    ctrl.form   = null;
    ctrl.data   = {};
    ctrl.hidden = [];

    // New state for every page change.
    ctrl.content = content = new Content();

    // No sense doing any work if we don't have an id to operate on
    if(!id) {
        return;
    }

    schema.on("value", function(snap) {
        content.setSchema(snap.val(), snap.key());

        m.redraw();
    });

    // On updates from firebase we need to merge in fields carefully
    ref.on("value", function(snap) {
        var data = snap.val();

        // Don't try to grab non-existent data
        if(!snap.exists()) {
            return m.route(prefix("/content/" + m.route.param("schema")));
        }

        content.processServerData(snap.val(), ref);

        ctrl.data = assign(data, {
            fields : merge(data.fields, content.fields)
        });

        // Create slug value if it doesnt exist already
        if(!ctrl.data.slug) {
            ctrl.data.slug = sluggo(content.meta.name);
        }

        return m.redraw();
    });

    watch(ref);
}

export function view(ctrl) {
    var state = ctrl.content.get(),
        title;

    if(!state.schema) {
        return m.component(layout);
    }

    title = [ get(state.meta, "name"), get(state.schema, "name") ]
        .filter(Boolean)
        .map(capitalize)
        .join(" | ");

    if(!ctrl.id) {
        m.route("/listing/" + state.schema.key);
    }

    return m.component(layout, {
        title   : title,
        content : [
            m("div", { class : layout.css.content },
                m.component(head,     { content : ctrl.content }),
                m.component(formView, { content : ctrl.content })
            )
        ]
    });
}
