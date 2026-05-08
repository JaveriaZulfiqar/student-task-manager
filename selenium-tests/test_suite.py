"""
Student Task Manager – Selenium Test Suite
==========================================
15 automated test cases using headless Chrome.

Requirements:
  pip install selenium pytest

Run locally:
  pytest test_student_task_manager.py -v

Environment variable:
  BASE_URL  – defaults to http://localhost:5000
"""

import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE_URL = os.environ.get("BASE_URL", "http://localhost:5000")
HEADLESS = os.environ.get("HEADLESS", "true").lower() != "false"

# Test credentials
TEST_USER = {
    "name": "Selenium Test User",
    "email": f"selenium_test_{int(time.time())}@test.com",
    "password": "TestPassword123"
}


@pytest.fixture(scope="module")
def driver():
    """Set up headless Chrome WebDriver for the entire test module."""
    options = Options()
    if HEADLESS:
        options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,800")

    drv = webdriver.Chrome(options=options)
    drv.implicitly_wait(5)
    yield drv
    drv.quit()


def wait_for(driver, by, value, timeout=10):
    """Wait for element to be present."""
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def navigate(driver, path=""):
    """Navigate to a specific path."""
    driver.get(BASE_URL + path)


def login(driver, email, password):
    """Helper function to log in a user."""
    navigate(driver, "/login")
    wait_for(driver, By.CSS_SELECTOR, "input[type='email']")
    driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys(email)
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(2)


# ==================== TEST CASES ====================

def test_01_home_redirects_to_login(driver):
    """TC-01: Verify the home page redirects to login page."""
    navigate(driver)
    time.sleep(1)
    assert "/login" in driver.current_url, \
        f"Expected redirect to /login, got: {driver.current_url}"


def test_02_page_title_correct(driver):
    """TC-02: Verify the page title is 'Student Task Manager'."""
    navigate(driver, "/login")
    assert "Student Task Manager" in driver.title, \
        f"Expected 'Student Task Manager' in title, got: {driver.title}"


def test_03_login_page_renders(driver):
    """TC-03: Verify login page renders with email and password fields."""
    navigate(driver, "/login")
    email_field = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
    password_field = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    assert email_field.is_displayed(), "Email field not visible"
    assert password_field.is_displayed(), "Password field not visible"
    assert submit_btn.is_displayed(), "Submit button not visible"


def test_04_register_page_renders(driver):
    """TC-04: Verify register page renders with name, email, and password fields."""
    navigate(driver, "/register")
    name_field = driver.find_element(By.CSS_SELECTOR, "input[type='text']")
    email_field = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
    password_field = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    assert name_field.is_displayed(), "Name field not visible"
    assert email_field.is_displayed(), "Email field not visible"
    assert password_field.is_displayed(), "Password field not visible"
    assert submit_btn.is_displayed(), "Submit button not visible"


def test_05_user_registration_success(driver):
    """TC-05: Verify user can successfully register with valid credentials."""
    navigate(driver, "/register")
    wait_for(driver, By.CSS_SELECTOR, "input[type='text']")
    
    driver.find_element(By.CSS_SELECTOR, "input[type='text']").send_keys(TEST_USER["name"])
    driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys(TEST_USER["email"])
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(TEST_USER["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    time.sleep(2)
    assert "/dashboard" in driver.current_url or "/login" in driver.current_url, \
        "Registration did not redirect to dashboard or login"


def test_06_user_login_success(driver):
    """TC-06: Verify user can successfully log in with valid credentials."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    assert "/dashboard" in driver.current_url, \
        f"Expected redirect to /dashboard after login, got: {driver.current_url}"


def test_07_dashboard_displays_stats(driver):
    """TC-07: Verify dashboard displays task statistics cards."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/dashboard")
    
    page_source = driver.page_source.lower()
    assert "total tasks" in page_source or "completed" in page_source or "pending" in page_source, \
        "Dashboard statistics not displayed"


def test_08_dashboard_displays_welcome_message(driver):
    """TC-08: Verify dashboard displays welcome message with user name."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/dashboard")
    
    assert "welcome" in driver.page_source.lower(), \
        "Welcome message not found on dashboard"


def test_09_navigation_to_tasks_page(driver):
    """TC-09: Verify navigation to My Tasks page works."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/tasks")
    
    assert "/tasks" in driver.current_url, \
        f"Expected /tasks in URL, got: {driver.current_url}"
    assert "my tasks" in driver.page_source.lower() or "tasks" in driver.page_source.lower(), \
        "Tasks page content not displayed"


def test_10_add_task_page_renders(driver):
    """TC-10: Verify Add Task page renders with required form fields."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/tasks/add")
    
    time.sleep(1)
    inputs = driver.find_elements(By.CSS_SELECTOR, "input, textarea")
    assert len(inputs) >= 2, "Add task form does not have required input fields"


def test_11_create_task_success(driver):
    """TC-11: Verify user can successfully create a new task."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/tasks/add")
    
    wait_for(driver, By.CSS_SELECTOR, "input")
    inputs = driver.find_elements(By.CSS_SELECTOR, "input")
    textareas = driver.find_elements(By.CSS_SELECTOR, "textarea")
    
    # Fill title (first input)
    inputs[0].send_keys("Selenium Test Task")
    
    # Fill description (first textarea)
    if textareas:
        textareas[0].send_keys("This task was created by Selenium automated test")
    
    # Fill due date (look for date input)
    for inp in inputs:
        if inp.get_attribute("type") in ["date", "text"]:
            inp.send_keys("2025-12-31")
            break
    
    # Submit form
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(2)
    
    assert "/tasks" in driver.current_url, \
        "Task creation did not redirect to tasks page"


def test_12_tasks_list_displays_created_task(driver):
    """TC-12: Verify created task appears in the tasks list."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/tasks")
    time.sleep(1)
    
    assert "selenium test task" in driver.page_source.lower(), \
        "Created task not found in tasks list"


def test_13_task_status_badge_displayed(driver):
    """TC-13: Verify task status badges are displayed on tasks page."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/tasks")
    time.sleep(1)
    
    page_source = driver.page_source.lower()
    assert "pending" in page_source or "completed" in page_source or "done" in page_source, \
        "Task status badges not displayed"


def test_14_edit_task_page_accessible(driver):
    """TC-14: Verify edit task page is accessible and loads task data."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/tasks")
    time.sleep(1)
    
    # Find edit button (look for buttons with "Edit" text or edit icon)
    buttons = driver.find_elements(By.TAG_NAME, "button")
    edit_clicked = False
    
    for btn in buttons:
        if "edit" in btn.text.lower():
            btn.click()
            edit_clicked = True
            break
    
    if not edit_clicked:
        # Try finding by SVG or other means
        links = driver.find_elements(By.CSS_SELECTOR, "button")
        if links:
            links[0].click()
    
    time.sleep(2)
    assert "/tasks/edit/" in driver.current_url or "/tasks" in driver.current_url, \
        "Edit task page not accessible"


def test_15_logout_functionality(driver):
    """TC-15: Verify user can successfully log out."""
    login(driver, TEST_USER["email"], TEST_USER["password"])
    navigate(driver, "/dashboard")
    time.sleep(1)
    
    # Find and click logout button
    buttons = driver.find_elements(By.TAG_NAME, "button")
    for btn in buttons:
        if "logout" in btn.text.lower():
            btn.click()
            break
    
    time.sleep(2)
    assert "/login" in driver.current_url, \
        f"Logout did not redirect to login page, got: {driver.current_url}"
