from odoo import fields, models, api


class MailMessage(models.Model):
    _inherit = 'mail.message'

    # activity_creator_id field added for display the creator of activity in activity summary page
    # if the activity is ends, there is no info about creator in mail.message this is the reason for adding this field
    activity_creator_id = fields.Many2one('res.users', string='Activity Creator')

