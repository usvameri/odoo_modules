odoo.define('ThemeCustomize.ThemeCustomization', function(require) {
    'use strict';

//    require('web.dom_ready');
//    var websiteNavbarData = require('website.navbar');
    var webMenu = require('web.Menu');

    var webNavbar = webMenu.include({
         init: function (parent, menu_data) {
            this._super.apply(this, arguments);
            this.navbar_color = this._get_navbar_color(parent);
         },
         start: function () {
            this._super.apply(this, arguments);
         },
         _get_navbar_color: function(parent) {
            var self = this;
            var color = this._rpc({
                model: "ir.config_parameter",
                method: "get_navbar_color_code",
                args: [],
            }, {async: false}).then(function (result) {
                self._set_navbar_color(parent, result);
                return result;
            });
            return color;


        },
        _set_navbar_color:function(parent, color){
//            var darker_color = (color & 0xfefefe) >> 1;
//            console.log(darker_color);
            this._change_style(color);
        },
        _change_style: function (color) {
            var css = `
                .o_main_navbar{ background-color: ${color} !important; }
                .o_main_navbar > ul > li > a:hover { background-color: #96694c !important; }
                .o_main_navbar > a:hover { background-color: #96694c !important; }
                .o_MessagingMenu_counter { background-color: #96694c !important; }
                .btn-primary:not([role=radio]) { background-color: ${color} !important; }
                .nav-item > a[role=tab] { color: ${color} !important; }
                .o_main_navbar .show .dropdown-toggle { background-color: #96694c !important; }
                .page-title > h1.text-primary { color: #96694c !important; }
//                .custom-checkbox .custom-control-input:disabled:checked ~ .custom-control-label::before { background-color: ${color} !important; }
                .o_searchview_facet_label { background-color: ${color} !important; }
                .breadcrumb-item > a { color: ${color} !important; }
                .o_form_uri > span  { color: ${color} !important; }
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