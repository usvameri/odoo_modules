//This is created to done a activity with a feedback(not required) from activity board view.
odoo.define('mail_activity_board.done_activity_popup', function(require) {
    'use strict';

    var Widget = require('web.Widget');
    var AbstractAction = require('web.AbstractAction');
//    var ControlPanelMixin = require('web.ControlPanelMixin');
    var core = require('web.core');
    var _t = core._t;
    var DoneActivityPopup = AbstractAction.extend({
        template: 'done_activity_modal_view',
        events: {
            'click input#done_activity_btn': '_onClickDoneActivity',
        },
        init: function(parent, action) {
            this._super(parent, action);
            this.activity_id = action.activity_id;
            this.parent = parent;
        },
        _DoneActivityWithFeedback: function(feedback=false) {
            var self = this;
            self._rpc({
                route: '/mail_activity_board/done_activity_and_feedback',
                params: {
                    activity_id: self.activity_id,
                    feedback: feedback,
                },
            }).then(function(result) {
                window.location.reload();
            });
        },
        _onClickDoneActivity: function(e) {
            var feedback = this.$el.find('#activity_feedback').val();
            if(this.activity_id){
                if (feedback) {
                    this._DoneActivityWithFeedback(feedback);
                }
                else{
                    var response = confirm(_t("Are you sure to done this activity without feedback?"));
                    if (response) {
                        this._DoneActivityWithFeedback(false);
                    };
                }
            }
            else{
                alert(_t('No activity found! please try again.'));
            }
        },
    });
    core.action_registry.add('done_activity_popup', DoneActivityPopup);
    return DoneActivityPopup;
});