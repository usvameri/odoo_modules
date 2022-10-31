from odoo import fields, api, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    theme_primary_color = fields.Char('Theme Primary Color', help='Change Theme Primary Color')
    theme_secondary_color = fields.Char('Theme Secondary Color', help='Change Theme Secondary Color')
    theme_elements_hover_color = fields.Char('Theme Elements Hover Color', help='Change Theme Elements Hover Color')
    theme_primary_button_color = fields.Char('Theme Primary Button Color', help='Change Theme Primary Button Color')
    theme_secondary_button_color = fields.Char('Theme Secondary Button Color', help='Change Theme Secondary Button Color')

    @api.model
    def set_values(self):
        params = self.env['ir.config_parameter'].sudo()
        params.set_param('theme_primary_color', self.theme_primary_color)
        params.set_param('theme_secondary_color', self.theme_secondary_color)
        params.set_param('theme_elements_hover_color', self.theme_elements_hover_color)
        params.set_param('theme_primary_button_color', self.theme_primary_button_color)
        params.set_param('theme_secondary_button_color', self.theme_secondary_button_color)
        super(ResConfigSettings, self).set_values()

    @api.model
    def get_values(self):
        res = super(ResConfigSettings, self).get_values()
        res['theme_primary_color'] = self.env['ir.config_parameter'].sudo().get_param('theme_primary_color',
                                                                               default='#2b323a')
        res['theme_secondary_color'] = self.env['ir.config_parameter'].sudo().get_param('theme_secondary_color',
                                                                                      default='#2b323a')
        res['theme_elements_hover_color'] = self.env['ir.config_parameter'].sudo().get_param('theme_elements_hover_color',
                                                                                      default='#2b323a')
        res['theme_primary_button_color'] = self.env['ir.config_parameter'].sudo().get_param('theme_primary_button_color',
                                                                                      default='#2b323a')
        res['theme_secondary_button_color'] = self.env['ir.config_parameter'].sudo().get_param('theme_secondary_button_color',
                                                                                      default='#2b323a')
        return res



