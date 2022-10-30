from odoo import models, fields, api


class IrConfigParameter(models.Model):
    _inherit = 'ir.config_parameter'

    @api.model
    def get_navbar_color_code(self):
        return self.get_param('navbar_color', default='#2b323a')
