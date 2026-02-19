from playwright.sync_api import sync_playwright
import json
import time
import re

def scrape_cognito_form():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navigate to the form
        url = "https://www.cognitoforms.com/TeahyungKim/TA%EC%8B%A0%EC%B2%AD%EC%84%A4%EB%AC%B8"
        print(f"Navigating to: {url}")
        page.goto(url, wait_until='networkidle')
        
        # Wait for the form to load
        print("Waiting for form to load...")
        time.sleep(5)  # Give extra time for JavaScript to render
        
        # Find the "희망과목" field and click on it to reveal options
        print("\n=== Looking for 희망과목 dropdown ===")
        
        # Find all cog-field elements that contain "희망과목"
        fields = page.query_selector_all('.cog-field')
        
        subjects = []
        
        for field in fields:
            label_text = field.text_content()
            if '희망과목' in label_text:
                print(f"Found field containing '희망과목'")
                
                # Find the dropdown/select input within this field
                dropdown = field.query_selector('.el-select, .el-input, input, [role="combobox"]')
                if dropdown:
                    print("Found dropdown element, clicking...")
                    try:
                        dropdown.click()
                        time.sleep(1)
                    except:
                        pass
                
                # Look for checkbox groups (common for multi-select)
                checkboxes = field.query_selector_all('.el-checkbox, .cog-checkbox, [class*="checkbox"]')
                if checkboxes:
                    print(f"Found {len(checkboxes)} checkbox items")
                    for cb in checkboxes:
                        label = cb.query_selector('label, .el-checkbox__label, span')
                        if label:
                            text = label.text_content().strip()
                            if text and text not in subjects:
                                subjects.append(text)
                                print(f"  - {text}")
        
        # Also look in the entire page for dropdown options that might have appeared
        print("\n=== Looking for opened dropdown options ===")
        options = page.query_selector_all('.el-select-dropdown__item, .el-dropdown-menu__item, [role="option"]')
        for opt in options:
            text = opt.text_content().strip()
            if text and text not in subjects:
                subjects.append(text)
                print(f"  - {text}")
        
        # Try to find subjects in any visible choice/option elements
        print("\n=== Looking for choice elements ===")
        choices = page.query_selector_all('.cog-checkboxes__choice, .cog-choice, [class*="choice"]')
        print(f"Found {len(choices)} choice elements")
        
        for choice in choices:
            text = choice.text_content().strip()
            # Filter out very long text and instructions
            if text and len(text) < 100 and '직전 학기' not in text and '설문' not in text:
                if text not in subjects:
                    subjects.append(text)
                    print(f"  - {text}")
        
        # Look at the HTML structure for insight
        print("\n=== Extracting from HTML ===")
        html_content = page.content()
        
        # Find pattern like data-label="과목명" or similar
        # Look for checkbox input patterns with labels
        checkbox_pattern = r'class="[^"]*checkbox[^"]*"[^>]*>.*?<span[^>]*>([^<]+)</span>'
        matches = re.findall(checkbox_pattern, html_content, re.DOTALL)
        
        for match in matches:
            text = match.strip()
            if text and len(text) < 100 and text not in subjects:
                # Filter out common non-subject text
                if not any(x in text for x in ['학기', '설문', '수강', '성적', 'Report', 'Terms']):
                    subjects.append(text)
        
        # Also look for cog-checkboxes pattern
        pattern = r'cog-checkboxes__choice-label[^>]*>([^<]+)<'
        matches = re.findall(pattern, html_content)
        for match in matches:
            text = match.strip()
            if text and text not in subjects:
                subjects.append(text)
        
        # Print final results
        print("\n" + "="*50)
        print("희망과목 목록 (Extracted Subjects):")
        print("="*50)
        
        if subjects:
            for i, subj in enumerate(subjects, 1):
                print(f"{i}. {subj}")
        else:
            print("No subjects found. Saving HTML for manual inspection...")
        
        # Save page HTML for inspection
        with open('/Users/aglyj0225/Desktop/LYJ/teacher/form_page.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("\nHTML saved to form_page.html")
        
        browser.close()
        
        return subjects

if __name__ == "__main__":
    scrape_cognito_form()
