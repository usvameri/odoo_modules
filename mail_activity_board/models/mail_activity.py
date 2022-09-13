from odoo import fields, models, api, _
from collections import defaultdict
from odoo.exceptions import MissingError

'''
Created on august 10, 2022
Migrate to V14 on september 13, 2022

@author: usvameria
'''
# TODO: action_done and feedback have little changes in V14 so i should check it


class MailActivity(models.Model):
    _name = 'mail.activity'
    _inherit = ['mail.activity', 'mail.thread']
    _mail_flat_thread = False

    assigned_user_id = fields.Many2one('res.users', track_visibility=True)
    create_user_id = fields.Many2one('res.users', track_visibility=True)
    date_deadline = fields.Date(track_visibility=True)
    summary = fields.Char(track_visibility=True)
    note = fields.Html(track_visibility=True)
    activity_type_id = fields.Many2one('mail.activity.type', track_visibility=True)

    # @api.multi
    def open_origin(self, args, res_id=False, res_name=False, **kwargs):
        self.ensure_one()
        vid = self.env[res_name or self.res_model].browse(int(res_id) or self.res_id).get_formview_id()
        action = {
            'type': 'ir.actions.act_window',
            'res_model': res_name if res_name else self.res_model,
            'view_mode': 'form',
            'res_id': int(res_id) if res_id else self.res_id,
            'target': 'new',
            'flags': {
                'form': {
                    'action_buttons': False
                }
            },
            'views': [
                (vid, "form")
            ]
        }
        return action

    # @api.multi
    def action_activity_done(self):
        self.action_feedback()
        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }

    # @api.multi
    def action_feedback(self, feedback=False, attachment_ids=None):
        self.inbox_message()
        message = self.env['mail.message']
        if feedback:
            self.write(dict(feedback=feedback))

        # Search for all attachments linked to the activities we are about to unlink. This way, we
        # can link them to the message posted and prevent their deletion.
        attachments = self.env['ir.attachment'].search_read([
            ('res_model', '=', self._name),
            ('res_id', 'in', self.ids),
        ], ['id', 'res_id'])

        activity_attachments = defaultdict(list)
        for attachment in attachments:
            activity_id = attachment['res_id']
            activity_attachments[activity_id].append(attachment['id'])

        for activity in self:
            record = self.env[activity.res_model].browse(activity.res_id)
            record.message_post_with_view(
                'mail.message_activity_done',
                values={'activity': activity},
                subtype_id=self.env['ir.model.data'].xmlid_to_res_id('mail.mt_activities'),
                mail_activity_type_id=activity.activity_type_id.id,
            )

            # Moving the attachments in the message
            activity_message = record.message_ids[0]
            message_attachments = self.env['ir.attachment'].browse(activity_attachments[activity.id])
            if message_attachments:
                message_attachments.write({
                    'res_id': activity_message.id,
                    'res_model': activity_message._name,
                })
                activity_message.attachment_ids = message_attachments
            message |= activity_message
        message.activity_creator_id = self.create_user_id
        self.unlink()
        return message.ids and message.ids[0] or False

    def inbox_message(self):
        assigned_user, create_user = self.user_id, self.create_user_id
        if create_user and assigned_user:

            """
            Send user chat notification on activity is done
            """
            # create the related document link
            web_base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
            link = """{}/web#id={}&view_type=form&model={}""".format(web_base_url, self.res_id, self.res_model)
            # construct the message that is to be sent to the user
            new_message_text = _("I have completed my activity in the <strong><a href='%s'>%s</a></strong> document.") % (link, self.res_name )

            # odoo runbot
            # odoobot_id = self.env['ir.model.data'].sudo().xmlid_to_res_id("base.partner_root")
            # I'm not sure if this is the best way to get the user id of the odoo bot

            # find if a channel was opened before
            channel_name1 = create_user.partner_id.name + ', ' + assigned_user.partner_id.name
            channel_name2 = assigned_user.partner_id.name + ', ' + create_user.partner_id.name
            channel = self.env['mail.channel'].sudo().search([
                ('channel_type', '=', 'chat'),
                ('name', 'in', (channel_name1, channel_name2)),
                ('channel_partner_ids', '=', [assigned_user.partner_id.id, create_user.partner_id.id])
            ], limit=1,)

            if not channel:
                # create a new channel
                channel = self.env['mail.channel'].with_context(mail_create_nosubscribe=True).create({
                    'channel_partner_ids': [(4, assigned_user.partner_id.id), (4, create_user.partner_id.id)],
                    'public': 'private',
                    'channel_type': 'chat',
                    'email_send': False,
                    'name': channel_name2,
                    'display_name': f'Activity Update',
                })

            # send a message to the related user
            channel.sudo().message_post(
                body=new_message_text,
                author_id=assigned_user.partner_id.id,
                message_type="comment",
                subtype="mail.mt_comment",
                subject=f'Activity Update',
            )
        else:
            pass

    @api.depends('res_model', 'res_id')
    def _compute_res_name(self):
        for activity in self:
            if activity.res_model and activity.res_id:
                activity.res_name = self.env[activity.res_model].browse(activity.res_id).name_get()[0][1]
            else:
                raise MissingError(_('Unable to find the object related to the activity.'))

    def search_with_assigned_and_created_user(self, args, assigned_user_name, create_user_name):
        assigned_users = self.env['res.users'].search([('name', 'ilike', assigned_user_name)])
        create_users = self.env['res.users'].search([('name', 'ilike', create_user_name)])
        return self.search_read([('user_id', 'in', assigned_users.ids),  ('create_user_id', 'in', create_users.ids)])
