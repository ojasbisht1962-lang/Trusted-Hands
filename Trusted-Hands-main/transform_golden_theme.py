#!/usr/bin/env python3
"""
Transform all CSS files from orange to golden yellow professional theme
"""
import os
import re
from pathlib import Path

# Color mapping for transformation - Orange to Golden Yellow
COLOR_MAPPINGS = {
    # Primary colors - Orange to Golden Yellow
    r'#FF8C00': '#FDB913',
    r'#FF6F00': '#F5A623',
    r'#FFA500': '#FFCE3D',
    
    # RGB and RGBA patterns
    r'rgba?\(255,\s*140,\s*0': 'rgba(253, 185, 19',
    r'rgba?\(255,\s*111,\s*0': 'rgba(245, 166, 35',
    r'rgba?\(255,\s*165,\s*0': 'rgba(255, 206, 61',
}

def transform_css_file(file_path):
    """Transform a single CSS file from orange to golden yellow"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all color mappings
        for pattern, replacement in COLOR_MAPPINGS.items():
            content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error transforming {file_path}: {e}")
        return False

def main():
    """Main function to transform all CSS files"""
    frontend_dir = Path(__file__).parent / 'frontend' / 'src'
    
    # Find all CSS files
    css_files = list(frontend_dir.rglob('*.css'))
    
    print(f"🎨 Transforming {len(css_files)} CSS files to Golden Yellow theme...\n")
    
    transformed_count = 0
    for css_file in css_files:
        if transform_css_file(css_file):
            transformed_count += 1
            print(f"✅ {css_file.relative_to(frontend_dir)}")
    
    print(f"\n🌟 Complete! Transformed {transformed_count}/{len(css_files)} files to professional golden yellow theme")

if __name__ == '__main__':
    main()
