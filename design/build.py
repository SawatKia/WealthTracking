import os
import shutil
from pathlib import Path
from csscompressor import compress as compress_css
from jsmin import jsmin
from htmlmin import minify

# Define directories and files
source_dir = Path('newClassesDesign')
build_dir = Path('build')
preview_dir = Path('preview')

# Create the build directory and subdirectories
subdirs = [
    'newClassesDesign/api',
    'newClassesDesign/BankAccountManagement',
    'newClassesDesign/IncomeExpenseManagement',
    'newClassesDesign/TransactionManagement',
    'newClassesDesign/UserManagement'
]

# Create build directory and subdirectories
build_dir.mkdir(parents=True, exist_ok=True)
for subdir in subdirs:
    (build_dir / subdir).mkdir(parents=True, exist_ok=True)

# Copy necessary files to the build directory
shutil.copy(preview_dir / 'diagramPreview.html', build_dir)
shutil.copy(preview_dir / 'diagramPreview.css', build_dir)
shutil.copy(preview_dir / 'diagramPreview.js', build_dir)

# Copy .mmd and .svg files to the build directory, maintaining folder structure
for file in source_dir.glob('**/*'):
    if file.suffix in {'.mmd', '.svg'}:
        relative_path = file.relative_to(source_dir)
        target_path = build_dir / relative_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(file, target_path)

# Minify HTML
html_file_path = build_dir / 'diagramPreview.html'
with open(html_file_path, 'r', encoding='utf-8') as file:
    html_content = file.read()

# Update HTML references for minified CSS and JS
html_content = html_content.replace('diagramPreview.css', 'diagramPreview.min.css')
html_content = html_content.replace('diagramPreview.js', 'diagramPreview.min.js')

# Minify HTML using htmlmin
minified_html = minify(html_content, remove_empty_space=True, remove_comments=True)
with open(build_dir / 'diagramPreview.min.html', 'w', encoding='utf-8') as file:
    file.write(minified_html)

# Minify CSS
css_file_path = build_dir / 'diagramPreview.css'
with open(css_file_path, 'r', encoding='utf-8') as file:
    minified_css = compress_css(file.read())
with open(build_dir / 'diagramPreview.min.css', 'w', encoding='utf-8') as file:
    file.write(minified_css)

# Minify JS
js_file_path = build_dir / 'diagramPreview.js'
with open(js_file_path, 'r', encoding='utf-8') as file:
    minified_js = jsmin(file.read())
with open(build_dir / 'diagramPreview.min.js', 'w', encoding='utf-8') as file:
    file.write(minified_js)

# Clean up unnecessary files
os.remove(css_file_path)
os.remove(js_file_path)
os.remove(html_file_path)

print("Build process completed.")
