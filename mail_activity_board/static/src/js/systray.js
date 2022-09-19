//This widget is displaying done and active activities count in systray field.
odoo.define('mail_activity_board.systray', function (require) {
    var SystrayMenu = require('web.SystrayMenu');
    var Widget = require('web.Widget');
    var rpc = require('web.rpc');
    var session = require('web.session');
    var core = require('web.core');
    var QWeb = core.qweb;

    var ActivityUserMenu = Widget.extend({
        template: 'user_activity_count',
        events: {
            'click a#activity_count_summary': '_onActivitySummaryClick',
            'click a.active-activities': '_onActiveActivitiesClick',
        },
        init: function (parent, value) {
            this._super(parent);
            this.user_id = session.user_context.uid;
            this.user_done_activity_count = 0;
            this.user_active_activity_count = 0;
        },
        start: function () {
            this._super.apply(this, arguments);
        },
        _get_user_activity_counts: function () {
            rpc.query({
                model: 'res.users',
                method: 'get_activity_counts',
                args: [this.user_id],
            }).then(function (result) {
                self.$('.my_activity_count_dropdown').html(QWeb.render('user_activity_count_detail', {
                  user_done_activity_count: result['user_done_activity_count'],
                  user_active_activity_count: result['user_active_activity_count'],
                }));
            });
        },
        //Show active and done activities count in dropdown menu.
        _onActivitySummaryClick: function (ev) {
            this._get_user_activity_counts();
        },
        //Open activities list view on click of active activities count
        _onActiveActivitiesClick : function (ev) {
            var self = this;
            self.do_action({
                type: 'ir.actions.client',
                res_model: 'mail.activity',
                tag: 'custom_activity',
                target: 'new',
            });
        },
    });
    SystrayMenu.Items.push(ActivityUserMenu);
    return ActivityUserMenu;
});