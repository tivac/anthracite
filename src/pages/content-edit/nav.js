import m from "mithril";
import moment from "moment";
import fuzzy from "fuzzysearch";
import debounce from "lodash.debounce";
import slug from "sluggo";

import config, { icons } from "../../config";
    
import db from "../../lib/firebase";
import prefix from "../../lib/prefix";

import css from "./nav.css";
    
export function controller() {
    var ctrl = this,

        schema = db.child("schemas/" + m.route.param("schema"));

    ctrl.page = 0;

    ctrl.schema  = null;
    ctrl.content = null;
    ctrl.results = null;

    schema.on("value", function(snap) {
        ctrl.schema = snap.val();
        ctrl.schema.key = snap.key();

        m.redraw();
    });

    // Go get initial data
    db.child("content/" + ctrl.schema.key).orderByChild("published_at").on("value", function(snap) {
        var content = [];

        snap.forEach(function(record) {
            var data = record.val();

            data.key          = record.key();
            data.published_at = data.published_at || data.published;
            data.search       = slug(data.name, { separator : "" });

            data.moments = {
                published : moment(data.published_at),
                updated   : moment(data.updated_at)
            };

            content.push(data);
        });

        ctrl.content = content;

        m.redraw();
    });

    // Event handlers
    ctrl.add = function() {
        var result;

        result = db.child("content/" + ctrl.schema.key).push({
            name       : "New " + ctrl.schema.name,
            created_at : db.TIMESTAMP,
            created_by : db.getAuth().uid
        });

        m.route(prefix("/content/" + ctrl.schema.key + "/" + result.key()));
    };

    ctrl.change = function(page, e) {
        e.preventDefault();

        ctrl.page = page;
    };

    // m.redraw calls are necessary due to debouncing, this function
    // may not be executing during a planned redraw cycle
    ctrl.filter = debounce(function(input) {
        if(input.length < 2) {
            ctrl.results = false;

            return m.redraw();
        }

        input = slug(input);

        ctrl.results = ctrl.content.filter(function(content) {
            return fuzzy(input, content.search);
        });

        return m.redraw();
    }, 100);

    ctrl.remove = function(data) {
        var ref = db.child("content").child(ctrl.schema.key).child(data.key);

        if(window.confirm("Remove " + data.name + "?")) {
            ref.remove().catch(console.error.bind(console));
        }
    };
}

export function view(ctrl) {
    var current = m.route(),
        content = ctrl.results || ctrl.content || [],
        now     = Date.now(),
        locked  = config.locked;

    return m("div", { class : css.nav },
        m(".head", { class : css.filter },
            m("input", {
                class       : css.text,
                placeholder : "Search...",
                oninput     : m.withAttr("value", ctrl.filter)
            })
        ),
        m("div", { class : css.body },
            m("ul", { class : css.list },
                content
                .sort(function(a, b) {
                    var aTime = a.published_at || a.published || a.updated_at,
                        bTime = b.published_at || b.published || b.updated_at;

                    return bTime - aTime;
                })
                .map(function(data) {
                    var url      = "/content/" + ctrl.schema.key + "/" + data.key,
                        cssClass = css.item,
                        status;

                    if(data.published_at && current.indexOf(url) === 0) {
                        cssClass = css.activePublished;
                    } else if(current.indexOf(url) === 0) {
                        cssClass = css.active;
                    } else if(data.published_at) {
                        cssClass = css.published_at;
                    }

                    if(data.published_at > now) {
                        status = "scheduled: " + data.moments.published.format("L");
                    } else if(data.published_at < now) {
                        status = "published: " + data.moments.published.format("L");
                    } else {
                        status = "updated: " + data.moments.updated.format("L");
                    }

                    return m("li", { class : cssClass },
                        m("a", {
                                class  : css.anchor,
                                href   : prefix("/content/" + ctrl.schema.key + "/" + data.key),
                                config : m.route
                            },
                            m("h3", { class : css.heading }, data.name),
                            m("p", { class : css.date },
                                status
                            )
                        ),
                        m("div", { class : css.actions },
                            ctrl.schema.preview ?
                                m("a", {
                                        class  : css.preview,
                                        title  : "Preview",
                                        href   : ctrl.schema.preview + data.key,
                                        target : "_blank"
                                    },
                                    m("svg", { class : css.icon },
                                        m("use", { href : icons + "#preview" })
                                    )
                                ) :
                                null,
                            m("button", {
                                    // Attrs
                                    class    : css.remove,
                                    title    : "Remove",
                                    disabled : locked || null,
                                    
                                    // Events
                                    onclick : ctrl.remove.bind(ctrl, data)
                                },
                                m("svg", { class : css.icon },
                                    m("use", { href : icons + "#remove" })
                                )
                            )
                        )
                    );
                })
            )
        ),
        m("div", { class : css.metas },
            m("button", {
                    onclick  : ctrl.add,
                    class    : css.add,
                    disabled : locked || null
                },
                "Add " + ctrl.schema.name
            )
        )
    );
}
