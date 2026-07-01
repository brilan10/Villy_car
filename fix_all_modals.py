import os, glob, re

path = 'c:/Users/yomiy/Documents/Proyectos/Villy Car/src/frontend/components/*.jsx'
for filepath in glob.glob(path):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We will completely overwrite the overlay inline styles to guarantee it works.
    def overlay_replacer(match):
        # We find the style block for the modal overlay.
        # It's better to just replace the whole style attribute.
        return 'style={{ position: \'fixed\', top: 0, left: 0, right: 0, bottom: 0, minHeight: \'100vh\', backgroundColor: \'rgba(0,0,0,0.7)\', display: \'flex\', flexDirection: \'column\', overflowY: \'auto\', zIndex: 1000, backdropFilter: \'blur(4px)\', padding: \'40px 20px\' }}'

    # Match the div with position: fixed and bottom: 0 that wraps the modal
    content = re.sub(r"style={{[^}]*position:\s*'fixed'[^}]*bottom:\s*0[^}]*}}", overlay_replacer, content)

    # For the card inside, we want margin: 'auto' so it vertically and horizontally centers when there is space, but doesn't cut off when there isn't.
    # Actually, in a column flexbox with overflow-y auto, margin: auto behaves perfectly.
    def card_replacer(match):
        style = match.group(0)
        style = re.sub(r"margin:\s*'[^']+'", "margin: 'auto'", style)
        if "margin: 'auto'" not in style:
            style = style.replace("}}", ", margin: 'auto' }}")
            
        style = re.sub(r"maxHeight:\s*'[^']+',?\s*", "", style)
        style = re.sub(r"overflowY:\s*'[^']+',?\s*", "", style)
        
        return style

    content = re.sub(r"<div className=\"[^\"]*card[^\"]*\".*?style={{.*?}}", card_replacer, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Modals converted to flex-column with margin auto for perfect centering and full background.')
