import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(path):
    try:
        with zipfile.ZipFile(path, 'r') as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = tree.findall('.//w:p', ns)
            text = []
            for p in paragraphs:
                texts = p.findall('.//w:t', ns)
                p_text = ''.join([t.text for t in texts if t.text])
                if p_text:
                    text.append(p_text)
            return '\n'.join(text)
    except Exception as e:
        return str(e)

text = read_docx('Informe_Villy_Car.docx')
with open('docx_out.txt', 'w', encoding='utf-8') as f:
    f.write(text)
