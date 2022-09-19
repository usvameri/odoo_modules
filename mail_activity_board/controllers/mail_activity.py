# -*- coding: utf-8 -*-
'''
Created on Aug 25, 2022

@author: usvameria
'''

from odoo import http
from odoo.http import request
from odoo.tools import pycompat, misc


class MailActivity(http.Controller):

    # Prepare all the data needed for create a new activity and return them to the view
    @http.route('/mail_activity_board/prepare_new_activity_data', type='json', auth='user')
    def prepare_new_activity_data(self):
        data = {
            'activity_models': [{'id': x.id, 'name': x.name} for x in request.env['ir.model'].search([
                                ('is_mail_thread', '=', True),
                                ('transient', '=', False)])],
            'activity_types': [{'id': x.id, 'name': x.name} for x in request.env['mail.activity.type'].search([])],
            'activity_users': [{'id': x.id, 'name': x.name} for x in request.env['res.users'].search([('active', '=', True)])],
        }
        return data

    # get selected model record to select one and relate it to the new activity
    @http.route('/mail_activity_board/get_res_records', type='json', auth='user')
    def get_res_records(self, model_id, domain):
        model = request.env['ir.model'].search([('id', '=', model_id)])
        for search_field in request.env[model.model]._fields:
            records = request.env[model.model].search([
                (search_field, 'ilike', domain),
            ], limit=10)
            if records:
                return [{'id': x.id, 'name': x.display_name} for x in records]

    # create a new activity with given data
    @http.route('/mail_activity_board/create_new_activity', type='json', auth='user')
    def create_new_activity(self, model_id, res_id, **kwargs):
        activity = request.env['mail.activity'].create({
            'res_model_id': int(model_id),
            'res_id': int(res_id),
            'activity_type_id': int(kwargs.get('activity_type_id')),
            'user_id': int(kwargs.get('assigned_user_id')),
            'date_deadline': kwargs.get('activity_deadline_date'),
            'summary': kwargs.get('activity_summary'),
        })

        return activity.id

    @http.route('/mail_activity_board/done_activity_and_feedback', type='json', auth='user')
    def done_activity_and_feedback(self, activity_id, feedback):
        activity = request.env['mail.activity'].search([('id', '=', int(activity_id))])
        if activity:
            activity.action_feedback(feedback)
            return True
        else:
            return False
