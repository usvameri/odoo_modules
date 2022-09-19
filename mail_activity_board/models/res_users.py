from odoo import fields, models, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    done_activity_count = fields.Integer(compute='_compute_done_activity_count')
    active_activity_count = fields.Integer(compute='_compute_active_activity_count')

    # Get active activity count of user
    def _compute_active_activity_count(self):
        for user in self:
            user.active_activity_count = self.env['mail.activity'].search_count([('user_id', '=', self.id)])

    # Get done activity count of user
    def _compute_done_activity_count(self):
        for user in self:
            user.done_activity_count = self.env['mail.message'].search_count([
                ('subtype_id', '=', 3), ('author_id', '=', user.partner_id.id),
            ])

    # Get done and active activity counts of user
    # This method is used in activity page widget
    def get_activity_counts(self):
        res = {
            'user_done_activity_count': self.done_activity_count,
            'user_active_activity_count': self.env['mail.activity'].search_count([('user_id', '=', self.id)]),
        }
        return res

    # Get user's activity summaries
    def get_activity_summary_list(self, user_id=False):
        activities = []
        user_id = self.env['res.users'].search([('id', '=', user_id)]) if user_id else self
        for activity in self.env['mail.activity'].search([('user_id', '=', user_id.id)]):
            activities.append({
                'id': activity.id,
                'res_name': activity.res_name,
                'creator': activity.create_uid.name,
                'assigned_user': activity.user_id.name,
                'date_deadline': activity.date_deadline,
                'summary': activity.summary,
                'type': activity.activity_type_id.name,
            })
        for done_activity in self.env['mail.message'].search([('subtype_id', '=', 3), ('author_id', '=', user_id.partner_id.id)]):
            activities.append({
                'id': done_activity.id,
                'res_name': done_activity.record_name,
                'end_by': done_activity.create_uid.name,
                'end_date': done_activity.create_date,
                'date_deadline': '',
                'creator': done_activity.activity_creator_id.name or '',
                # TODO: Get activity creator from mail.message
                # new message is created when someone ends their activity, so creation date is our end date
                'summary': done_activity.body,
                'type': done_activity.subtype_id.name,
                'state': 'done',
            })
        return activities

    # Get activity summaries of all users
    def get_users_activity_summary(self):
        users = self.env['res.users'].search([])
        summary_lines = []
        for user in users:
            counts = user.get_activity_counts()
            summary_lines.append({
                'user_id': user.id,
                'user': user.name,
                'done_activity_count': counts['user_done_activity_count'],
                'active_activity_count': counts['user_active_activity_count'],
            })
        return summary_lines
