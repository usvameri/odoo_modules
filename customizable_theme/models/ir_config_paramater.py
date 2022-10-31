from odoo import models, fields, api


class IrConfigParameter(models.Model):
    _inherit = 'ir.config_parameter'

    @api.model
    def get_theme_colors(self):
        colors = {
            'theme_primary_color': self.get_param('theme_primary_color', default='#2b323a'),
            'theme_secondary_color': self.get_param('theme_secondary_color', default='#2b323a'),
            'theme_elements_hover_color': self.get_param('theme_elements_hover_color', default='#2b323a'),
            'theme_primary_button_color': self.get_param('theme_primary_button_color', default='#2b323a'),
            'theme_secondary_button_color': self.get_param('theme_secondary_button_color', default='#2b323a'),
        }
        return colors
