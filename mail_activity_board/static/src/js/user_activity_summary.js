odoo.define('user_activity_summary', function (require) {
    var core = require('web.core');
    var AbstractAction = require('web.AbstractAction');
    var rpc = require('web.rpc');
    var session = require('web.session');
    var QWeb = core.qweb;
    var _t = core._t;
    require('web.dom_ready');

    var UserActivitySummary = AbstractAction.extend({
        template: 'activity_summary_modal',
        events: {
//            'click button.search-btn': '_onSearchClick',
            'keyup input.search-input': '_keyPressUserSearch',
            'click button.summary-btn': '_onSummaryClick',
            'click button.users-summary-btn': '_onUsersSummaryClick',
        },
        today: new Date().toJSON().slice(0,10).replace(/-/g,'-'),
        init: function (parent, value) {
            this._super(parent, value);
            this.users = [];
            this.selected_user_id = false;

        },
        get_user_activity_summary_list: function (user_id=false) {
            var self = this;
            rpc.query({
                model: 'res.users',
                method: 'get_activity_summary_list',
                args: [user_id || session.user_context.uid],
                kwargs: {
                    user_id: user_id || session.user_context.uid,
                },
            }).then(function (result) {
                var element = $('.content');
                element.html(QWeb.render('user_activities', {
                    activities: result,
                    today: self.today,
                }));
            });
        },
        get_users_activity_summary_list: function () {
            var self = this;
            rpc.query({
                model: 'res.users',
                method: 'get_users_activity_summary',
                args: [session.user_context.uid],
            }).then(function (result) {
                var element = $('.content');
                element.html(QWeb.render('users_activity_summaries', {
                    users_activity_summaries: result,
                    today: self.today,
                }));
            });
        },
        start: function () {
            this._super.apply(this, arguments);
            this.get_users_activity_summary_list();
            this.autocomplete_data();
            var search_input = this.$el.find('div.autocomplete > input');
            this.autocomplete(search_input);
        },
//        _onSearchClick: function (ev) {
//            var self = this;
//            self.get_user_activity_summary_list(self.selected_user_id);
//        },
        _keyPressUserSearch: function (ev) {
            var self = this;
            if (ev.keyCode === 13) {
                self.get_user_activity_summary_list(self.selected_user_id);
            }
        },
        _onSummaryClick: function (ev) {
            this.get_user_activity_summary_list();
            this.clear_search_input();
            this.$el.find('div.autocomplete').removeAttr('hidden');
        },
        _onUsersSummaryClick: function (ev) {
            this.get_users_activity_summary_list();
            this.clear_search_input();
            this.$el.find('div.autocomplete').attr('hidden', true);
        },
        clear_search_input: function () {
            var self = this;
            var input = self.$el.find('div.autocomplete > input');
            input.val('');
            // clear input record_id dataset value
            input.attr('data-record_id', '');
            self.selected_user_id = false;

        },
        autocomplete_data: function () {
            var self = this;
            rpc.query({
                model: 'res.users',
                method: 'search_read',
                args: [false, ['id', 'name']],
                }, {async: false}).then(function (result) {
                    self.users = result;
            });
        },
        autocomplete: function(inp) {
            var self = this;
            var arr = [];
            var currentFocus;
            inp[0].addEventListener("input", function(e) {
                var a, b, i, val = this.value;
                closeAllLists();
                if (!val) { return false;}
                currentFocus = -1;
                var arr = self.users;
                a = document.createElement("DIV");
                a.setAttribute("id", this.id + "autocomplete-list");
                a.setAttribute("class", "autocomplete-items");
                a.style.backgroundColor = "#fff";
                a.style.zIndex = 99;
                a.style.position = 'fixed';
                a.classList.add('border');
                a.classList.add('border-info');
                this.parentNode.appendChild(a);
                for (i = 0; i < arr.length; i++) {
                if (arr[i].name.toUpperCase().indexOf(val.toUpperCase()) > -1) {
                    b = document.createElement("DIV"); //add selectable elements as a list under the selection
                    b.style.margin = '5px';

                    b.innerHTML = "<strong>" + arr[i].name.substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].name.substr(val.length);
                    b.innerHTML += "<input type='hidden' class='selected-res-document' data-record_id='"+ arr[i].id  +"' value='" + arr[i].name + "'>";
                    b.addEventListener("click", function(e) { //when an element is clicked, select it and populate the input with its value
                        inp[0].value = this.getElementsByTagName("input")[0].value; //set record name to input
                        var record_id = this.getElementsByTagName("input")[0].getAttribute('data-record_id') //set record id to veriable
                        inp[0].setAttribute('data-record_id', record_id); //set record id to input
                        self.selected_user_id = record_id; // set record id to global variable
                        closeAllLists();
                    });
                    a.appendChild(b);
                  }
                }
            });
            inp[0].addEventListener("keydown", function(e) {
                var x = document.getElementById(this.id + "autocomplete-list");
                if (x) x = x.getElementsByTagName("div");
                if (e.keyCode == 40) { //down
                  currentFocus++;
                  addActive(x);
                } else if (e.keyCode == 38) { //up
                  currentFocus--;
                  addActive(x);
                } else if (e.keyCode == 13) {
                  e.preventDefault();
                  if (currentFocus > -1) {
                    if (x) x[currentFocus].click();
                  }
                }
            });

            function addActive(x) {
                if (!x) return false;
                removeActive(x);
                if (currentFocus >= x.length) currentFocus = 0;
                if (currentFocus < 0) currentFocus = (x.length - 1);
                x[currentFocus].classList.add("text-success");
            };
            function removeActive(x) {
                for (var i = 0; i < x.length; i++) {
                  x[i].classList.remove("text-success");
                }
            };
            function closeAllLists(elmnt) {
                var x = document.getElementsByClassName("autocomplete-items");
                for (var i = 0; i < x.length; i++) {
                  if (elmnt != x[i] && elmnt != inp) {
                    x[i].parentNode.removeChild(x[i]);
                  }
                }
            };
            document.addEventListener("click", function (e) {
               closeAllLists(e.target);
            });
        },//autocomplete for record selection

    });
    core.action_registry.add('user_activity_summary', UserActivitySummary);
    return UserActivitySummary;
});