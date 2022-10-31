odoo.define('ThemeCustomize.ThemeCustomization', function(require) {
    'use strict';

//    require('web.dom_ready');
//    var websiteNavbarData = require('website.navbar');
    var webMenu = require('web.Menu');

    var webNavbar = webMenu.include({
         init: function (parent, menu_data) {
            this._super.apply(this, arguments);
            this.colors = this._get_colors(parent);
         },
         start: function () {
            this._super.apply(this, arguments);
         },
         _get_colors: function(parent) {
            var self = this;
            var color = this._rpc({
                model: "ir.config_parameter",
                method: "get_theme_colors",
                args: [],
            }, {async: false}).then(function (colors) {
                self._change_style(parent, colors);
                return colors;
            });
            return color;


        },
        _change_style: function (parent, colors) {
            var css = `
                .o_main_navbar{ background-color: ${colors['theme_primary_color']} !important; }
                .o_main_navbar > ul > li > a:hover { background-color: ${colors['theme_elements_hover_color']} !important; }
                .o_main_navbar > a:hover { background-color: ${colors['theme_elements_hover_color']} !important; }
                .o_MessagingMenu_counter { background-color: ${colors['theme_secondary_color']} !important; }
                .btn-primary:not([role=radio]) { background-color: ${colors['theme_primary_button_color']} !important; }
                .btn-secondary:not([role=radio]) { background-color: ${colors['theme_secondary_color']} !important; }
                .nav-item > a[role=tab] { color: ${colors['theme_primary_color']} !important; }
                .o_main_navbar .show .dropdown-toggle { background-color: ${colors['theme_primary_color']} !important; }
                .page-title > h1.text-primary { color: ${colors['theme_secondary_color']} !important; }
                .o_searchview_facet_label { background-color: ${colors['theme_primary_color']} !important; }
                .breadcrumb-item > a { color: ${colors['theme_primary_color']} !important; }
                .o_form_uri > span  { color: ${colors['theme_primary_color']} !important; }
                `;
            var style = document.createElement('style');

            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            document.getElementsByTagName('head')[0].appendChild(style);

        },

    });

});