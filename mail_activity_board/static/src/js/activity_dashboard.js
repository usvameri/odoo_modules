odoo.define('mail_activity_board.custom_activity', function (require) {
   'use strict';
   var AbstractAction = require('web.AbstractAction');
   var core = require('web.core');
   var rpc = require('web.rpc');
   var QWeb = core.qweb;
   var _t = core._t;
   const concurrency = require('web.concurrency'); //(DropPrevious)
   var session = require('web.session');
   require('web.dom_ready');
   var CustomActivity = AbstractAction.extend({
       template: 'activity_table',
       events: {
            'keyup input.activity-search-input': '_onKeyupActivitySearchInput',
            'keypress input#assigned_user_search_input': '_onKeyupAssignedUserSearchInput',
            'keypress input#create_user_search_input': '_onKeyupCreateUserSearchInput',
            'click a.dropdown-item': '_onChangeFilterSelection',
            //toolbox buttons
            'click button.details-button': '_onClickDetails',
            'click button.trash-button': '_onClickTrash',
            'click button#new_activity_btn': '_onClickCreateNewActivity',
            'click button#done-button': '_onClickDoneActivity',
            'click button#user_activity_summary': '_onClickUserActivitySummary',
            'click button#assigned_by_me_btn': '_onClickAssignedByMeBtn',
            'click button#assigned_to_me_btn': '_onClickAssignedToMeBtn',
            'click a.activity_document_name_text': '_onClickDocumentName',
//            'dblclick a.activity_document_name_text': '_onDoubleClickDocumentName',
       },
       date_object: new Date(),
       today: new Date().toJSON().slice(0,10).replace(/-/g,'-'),
       init: function(parent, action) {
           this._super(parent, action);
           this._dp = new concurrency.DropPrevious();
           var activity_qty;
           var is_admin = false;
       },
       start: function() {
           var self = this;
           self.load_data();
           self._check_user_is_admin();
       },
       _render_user_search_input: function() {
           self.$('.assigned-user-col').html(QWeb.render('table_user_search_input', {}));
           self.$('.create-user-col').html(QWeb.render('table_create_user_search_input', {}));
       },
       _check_user_is_admin: function() {
              var self = this;
              session.user_has_group('website.group_website_designer')
                .then(function(result) {
                    if (result) {
                        self.is_admin = true;
                        self._render_user_search_input();
                    }
                });
       },
       _render_elements: function(datas) {
            var self = this;
            self.$('.activity_lines').html(QWeb.render('activity_table_lines', {
                  activities : datas,
                  current_date: self.today,
                  is_admin: self.is_admin,
            }));
            self.$('.activity_view_buttons').html(QWeb.render('activity_quantity_view', {
                  activity_qty: datas.length,
                  done_activity_count: session.user_context.done_activity_count,
            }));
            self.$el.parents('.o_action_manager').css('overflow', 'auto'); //to show scroll bar

       },
       //TODO: [usvameria] doesn't catch the data from the controller fix it (undefined)
       _get_base_activity_data: function() {
            var self = this;
            var result;
            self._rpc({route: '/mail_activity_board/prepare_new_activity_data'}, {async: false})
                .then(function(data) {
                    result = data; //data is undefined
            });
            return result;
       },
       _get_activities: function (domain , default_user_domain=true) {
          var self = this;
          var search_domain = [['user_id', '=', self.getSession().uid]];
          if (domain && default_user_domain) {
            search_domain = [['user_id', '=', self.getSession().uid], domain];
          }
          if(domain && !default_user_domain) {
            search_domain = [domain];
          }
          self._rpc({
            model: 'mail.activity',
            method: 'search_read',
            args: [search_domain],
          }).then(function(datas) {
             self._render_elements(datas);
          });
       },
       _get_activities_by_assigned_and_created_user: function (assigned_user, create_user) {
            var self = this;
            if (assigned_user && create_user) {
                this._rpc({
                    model: 'mail.activity',
                    method: 'search_with_assigned_and_created_user',
                    args: [assigned_user, create_user],
                    kwargs: {
                        assigned_user_name: assigned_user,
                        create_user_name: create_user
                    },
                }, {async:false}).then(function(datas) {
                    self._render_elements(datas);
                });
            }
       },
       load_data: function () {
            var self = this;
            self._get_activities(false);
       },
       _get_todays_activities: function(){
            var self = this;
            self._get_activities(['date_deadline', '=', self.today]);
       },
       _get_late_activities: function() {
            var self = this;
            self._get_activities(['date_deadline', '<', self.today]);
       },
       _get_future_activities: function() {
            var self = this;
            self._get_activities(['date_deadline', '>', self.today]);
       },
       _get_my_activities: function() {
            var self = this;
            self._get_activities(['user_id', '=', self.getSession().uid]);
       },
       _get_activities_assigned_by_me: function() {
            var self = this;
            self._get_activities(['create_user_id', '=', self.getSession().uid], false);
       },
       _onKeyupActivitySearchInput: function(event) {
            if(event.keyCode === 13) {
                var self = this;
                self._get_activities(['res_name', 'ilike', event.target.value])
            }
       },
       _onKeyupAssignedUserSearchInput: function(event) {
            if(event.keyCode === 13) {
                var self = this;
                var create_user = self.$('#create_user_search_input').val();
                if (create_user) {
                    self._get_activities_by_assigned_and_created_user(event.target.value, create_user);
                }else{
                    self._get_activities(['user_id', 'ilike', event.target.value], false);
                }
            }
       },
       _onKeyupCreateUserSearchInput: function(event) {
           if(event.keyCode === 13) {
                var self = this;
                var assigned_user = $('#assigned_user_search_input').val();
                if (assigned_user) {
                    self._get_activities_by_assigned_and_created_user(assigned_user, event.target.value);
                }
                else{
                    self._get_activities(['create_uid', 'ilike', event.target.value], false);
                }
            }
       },
       _onChangeFilterSelection: function(event) {
            var self = this;
            var filter = event.target.dataset.filter;
            if (filter === 'all_activities'){
                self.load_data();
            }
            if (filter === 'late_activities'){
                self._get_late_activities();
            }
            else if(filter === 'today_activities'){
                self._get_todays_activities();
            }
            else if(filter === 'future_activities'){
                self._get_future_activities();
            }
       },
       _onBackToActivity: function() {
           var self = this;
           var x = new MutationObserver(function (e) {
                e[0].removedNodes.forEach(function (node) {
                    if (node.className === 'modal-backdrop') {
                    // console.log('before disconnected')
                    x.disconnect();
//                    self.load_data();
                    };

                });
           });
           x.observe(document.getElementsByTagName('BODY')[0], { childList: true });
       },
       _onClickDetails: function(event) {
            if(event.target.dataset.id){
                this.do_action({
                    type: 'ir.actions.act_window',
                    view_type: 'form',
                    view_mode: 'form',
                    res_model: 'mail.activity',
                    views: [[false, 'form']],
                    res_id: Number(event.target.dataset.id),
                    target: 'new',
                    context: {
                        'default_res_model': 'mail.activity',
                        'default_res_id': event.target.dataset.id,
    //                    'form_view_initial_mode': 'edit',
                        'force_detailed_view': 'true'
                    },
                    flags : {
                        mode: 'edit',
                    }
                })
                this._onBackToActivity();
            ;}
            else{
                alert(_t('No activity id found! Please try again.'));
            }

       },
       _onClickTrash: function(event) {
            this.load_data();
            this.$('input.activity-search-input').val('');
            this.$('input.user-search-input').val('');
       },
       _onClickCreateNewActivity: function(event) {
            var self = this;
            self.do_action({
                type: 'ir.actions.client',
                name: _t('Create Activity'),
                tag: 'create_activity_popup',
                target: 'new',
            });
       },
       _onClickDoneActivity: function(event) {
            var self = this;
            if(event.target.dataset.id){
                self.do_action({
                    type: 'ir.actions.client',
                    name: 'Done Activity',
                    tag: 'done_activity_popup',
                    target: 'new',
                    activity_id: event.target.dataset.id,
                });
            }

       },
       _onClickAssignedByMeBtn: function(event) {
            var self = this;
            self._get_activities_assigned_by_me();
       },
       _onClickAssignedToMeBtn: function(event) {
            var self = this;
            self._get_my_activities();
       },
       _onClickDocumentName: function(event) {
            var self = this;
            var model = event.target.dataset.model;
            var res_id = event.target.dataset.id;
            if (model && res_id){
                self._rpc({
                    model: 'mail.activity',
                    method: 'open_origin',
                    args: [[res_id], model],
                    kwargs: {
                        'res_id': res_id,
                        'res_name': model,
                    },

                }, {async: false}).then(function(result) {
                    self.do_action(result);
                });

//                self.do_action({
//                    type: 'ir.actions.act_window',
//                    view_type: 'form',
//                    view_mode: 'form',
//                    res_model: model,
//                    views: [[false, 'form']],
//                    res_id: parseInt(res_id),
//                    target: 'new',
//                    flags : {
//                        action_buttons: false,
//                        mode: 'view',
//                    }
//                });
            };
       },
       //not for now
       _onDoubleClickDocumentName: function(event) {
            var self = this;
            if (event.target.dataset.id && event.target.dataset.model) {
                self._rpc({
                    model: 'mail.activity',
                    method: 'open_origin',
                    args: [],
                    res_id: event.target.dataset.id,
                    res_name: event.target.dataset.model,

                });
            };
       },
       //Green search button on the header to see activity counts
       _onClickUserActivitySummary: function(event) {
            var self = this;
            self.do_action({
                type: 'ir.actions.client',
                tag: 'user_activity_summary',
                target: 'new',
            });
        },
   });
   core.action_registry.add('custom_activity', CustomActivity);
   return CustomActivity
});