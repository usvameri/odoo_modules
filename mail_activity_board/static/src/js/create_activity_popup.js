// @author : usvameria
//This is crated for create activity from activity board view.
//It's opening a modal to fill required fields to create activity.
odoo.define('mail_activity_board.CreateActivityPopup', function (require) {
    "use strict";
    var AbstractAction = require('web.AbstractAction');
    var core = require('web.core');
    var CreateActivityPopup = AbstractAction.extend({
        template: 'new_activity_modal_view',
        events: {
            'click #create_activity_btn': '_onClickCreateNewActivity',
            'change #activity_res_model': '_onChangeActivityResModel',
            'change #activity_type_id': '_onChangeActivityType',
            'change #activity_assigned_user': '_onChangeAssignedUser',
            'change #activity_summary': '_onChangeActivitySummary',
            'change #activity_date': '_onChangeActivityDeadline',
        },
        //Fetch the data for the modal to select
        _get_base_activity_data: function() {
            var self = this;
            var result;
            self._rpc({route: '/mail_activity_board/prepare_new_activity_data'}, {async: false})
                .then(function(data) {
                    result = data;
            });
            console.log('result: ');
            console.log(result);
            return result;
        },
        init: function(parent, action) {
            this._super(parent, action);
            this.model_data = {
                'activity_models': [],
                'activity_types': [],
                'activity_users': [],
            };


            this.model_records = [];
            this.selected_model_id = false;
            this.selected_record_id = false;
            this.selected_activity_type = false;
            this.selected_activity_deadline_date = false;
            this.selected_assigned_user_id = false;
            this.activity_summary = '';
        },
        start: function() {
            var self = this;
            this.model_data = self._get_base_activity_data();
            var autocomplete_inp = self.$('#activity_res_name')
            self.autocomplete(autocomplete_inp);
            return this._super.apply(this, arguments);
        },
        // validate form is filled or not
        _validateForm: function() {
            if(!this.selected_model_id)
                return false;
            if(!this.selected_record_id)
                return false;
            if(!this.selected_activity_type)
                return false;
            if(!this.selected_activity_deadline_date)
                return false;
            if(!this.selected_assigned_user_id)
                return false;
            if(!this.activity_summary)
                return false;
            return true;
        },
        _onClickCreateNewActivity: function(e) {
            if (this._validateForm()) {
                this._rpc({
                    route: '/mail_activity_board/create_new_activity',
                    params: {
                        'model_id': this.selected_model_id,
                        'res_id': this.selected_record_id,
                        'activity_type_id': this.selected_activity_type,
                        'assigned_user_id': this.selected_assigned_user_id,
                        'activity_deadline_date': this.selected_activity_deadline_date,
                        'activity_summary': this.activity_summary,
                    },
                }).then(function(result) {
                    if (result) {
                        window.location.reload();
                    }
                });
            }
            else {
                alert('Please fill all fields');
            }
        },
        // if user selected a model enable the record selection
        _onChangeActivityResModel: function(e) {
            var self = this;
            self.selected_model_id = e.target.value;
            if (e.target.value){
                this.$el.find('#activity_res_name')[0].removeAttribute('disabled');
            }
            else{
                this.$el.find('#activity_res_name')[0].setAttribute('disabled', 'disabled');
            }
        },
        _onChangeActivityType: function(e) {
            this.selected_activity_type = e.target.value;
        },
        _onChangeAssignedUser: function(e) {
            this.selected_assigned_user_id = e.target.value;
        },
        _onChangeActivitySummary: function(e) {
            this.activity_summary = e.target.value;
        },
        _onChangeActivityDeadline: function(e) {
            this.selected_activity_deadline_date = e.target.value;
        },
        _get_res_records: function(search) {
            var self = this;
            self._rpc({route: '/mail_activity_board/get_res_records', params: {model_id: self.selected_model_id,domain: search}}, {async: false})
                .then(function(data) {
                    self.model_records = data;
            });
        },
        //autocomplete for record selection
        autocomplete: function(inp) {
            var self = this;
            var arr = [];
            var currentFocus;
            inp[0].addEventListener("input", function(e) {
                var a, b, i, val = this.value;
                closeAllLists();
                if (!val) { return false;}
                currentFocus = -1;
                self._get_res_records(e.target.value); //get selectable records
                var arr = self.model_records;
                a = document.createElement("DIV");
                a.setAttribute("id", this.id + "autocomplete-list");
                a.setAttribute("class", "autocomplete-items");
                a.style.backgroundColor = "#fff";
                a.style.zIndex = "99";
                a.style.position = "fixed";
                a.classList.add('border');
                a.classList.add('rounded');
                a.classList.add('border-info');
                this.parentNode.appendChild(a);
                for (i = 0; i < arr.length; i++) {
                if (arr[i].name.toUpperCase().indexOf(val.toUpperCase()) > -1) {
                    b = document.createElement("DIV"); //add selectable elements as a list under the selection
                    b.style.margin = "5px";
                    b.innerHTML = "<strong>" + arr[i].name.substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].name.substr(val.length);
                    b.innerHTML += "<input type='hidden' class='selected-res-document' data-record_id='"+ arr[i].id  +"' value='" + arr[i].name + "'>";
                    b.addEventListener("click", function(e) { //when an element is clicked, select it and populate the input with its value
                        inp[0].value = this.getElementsByTagName("input")[0].value; //set record name to input
                        var record_id = this.getElementsByTagName("input")[0].getAttribute('data-record_id') //set record id to veriable
                        inp[0].setAttribute('data-record_id', record_id); //set record id to input
                        self.selected_record_id = record_id; // set record id to global variable
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
        },
    });
    core.action_registry.add('create_activity_popup', CreateActivityPopup);
    return CreateActivityPopup;
});
