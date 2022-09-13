{
    'name': 'Mail Activity Board',
    'version': '12.0',
    'category': '',
    'author': "usvameria",
    'summary': '',
    'description': """
        Mail Activity Dashboard (Manage Activities)
    """,
    'depends': ['base', 'mail', 'web'],
    'data': [
        'views/assets.xml',

        'data/client_actions.xml',

        'views/ActivityUI.xml',
    ],
    'qweb': [
        'static/src/xml/*.xml',
    ],
    'installable': True,
}