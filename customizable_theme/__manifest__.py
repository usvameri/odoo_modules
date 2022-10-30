{
    'name': 'Theme Customization',
    'version': '12.0',
    'category': '',
    'author': "usvameria",
    'summary': '',
    'description': """
       test
    """,
    'depends': ['base', 'website', 'web'],
    'data': [
        'views/res_config_settings_view_form.xml',
        'views/assets.xml',
    ],
    'qweb': [
        'static/src/xml/*.xml',
    ],
    'installable': True,
}

