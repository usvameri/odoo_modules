from odoo import fields, api, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    navbar_color = fields.Char('Navbar Color', help='Change Navbar Color')

    @api.model
    def set_values(self):
        params = self.env['ir.config_parameter'].sudo()
        params.set_param('navbar_color', self.navbar_color)

        super(ResConfigSettings, self).set_values()

    @api.model
    def get_values(self):
        res = super(ResConfigSettings, self).get_values()
        res['navbar_color'] = self.env['ir.config_parameter'].sudo().get_param('navbar_color',
                                                                               default='#2b323a')
        return res



