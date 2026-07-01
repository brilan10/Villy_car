import os, glob, re

path = 'c:/Users/yomiy/Documents/Proyectos/Villy Car/src/frontend/components/*.jsx'
for filepath in glob.glob(path):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix double commas in style objects
    # e.g., style={{ flex: 1,  , margin: 'auto' }} -> style={{ flex: 1, margin: 'auto' }}
    def clean_style(match):
        style_content = match.group(0)
        # Remove empty commas like `, ,` or `,   ,`
        style_content = re.sub(r",\s*,", ",", style_content)
        # Also handle `style={{ ,`
        style_content = re.sub(r"style={{\s*,", "style={{", style_content)
        return style_content

    # Match anything inside style={{ ... }}
    content = re.sub(r"style={{.*?}}", clean_style, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Syntax errors fixed.')
