

import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC



BASE_URL = os.environ.get("BASE_URL", "http://localhost:5000")
HEADLESS  = os.environ.get("HEADLESS", "true").lower() != "false"



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
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def navigate(driver, path=""):
    driver.get(BASE_URL + path)



def test_01_home_page_loads(driver):
    """TC-01: Verify the home/dashboard page loads successfully."""
    navigate(driver)
    assert "Student Task Manager" in driver.title, \
        f"Expected 'Student Task Manager' in title, got: {driver.title}"
    heading = driver.find_element(By.TAG_NAME, "h1")
    assert heading is not None, "No <h1> found on home page"


def test_02_navbar_links_present(driver):
    """TC-02: Verify all navbar links exist and are clickable."""
    navigate(driver)
    nav = driver.find_element(By.TAG_NAME, "nav")
    links = nav.find_elements(By.TAG_NAME, "a")
    link_texts = [l.text.lower() for l in links]
    for expected in ["home", "students", "tasks", "search"]:
        assert expected in link_texts, f"Nav link '{expected}' not found. Found: {link_texts}"



def test_03_students_page_loads(driver):
    """TC-03: Verify /students page loads and displays the students table."""
    navigate(driver, "/students")
    assert "Students" in driver.page_source
    table = driver.find_element(By.ID, "students-table")
    assert table is not None, "Students table not found on /students"


def test_04_tasks_page_loads(driver):
    """TC-04: Verify /tasks page loads and displays the tasks table."""
    navigate(driver, "/tasks")
    assert "Tasks" in driver.page_source
    table = driver.find_element(By.ID, "tasks-table")
    assert table is not None, "Tasks table not found on /tasks"

def test_05_add_student_form_renders(driver):
    """TC-05: Verify /student/add page renders a form with name and email fields."""
    navigate(driver, "/student/add")
    name_field  = driver.find_element(By.ID, "name")
    email_field = driver.find_element(By.ID, "email")
    submit_btn  = driver.find_element(By.ID, "submit-student")
    assert name_field.is_displayed(),  "Name field not visible"
    assert email_field.is_displayed(), "Email field not visible"
    assert submit_btn.is_displayed(),  "Submit button not visible"


def test_06_add_student_success(driver):
    """TC-06: Submit valid data and verify the student appears in the list."""
    navigate(driver, "/student/add")
    driver.find_element(By.ID, "name").send_keys("Selenium Tester")
    driver.find_element(By.ID, "email").send_keys("selenium@test.com")
    driver.find_element(By.ID, "submit-student").click()

    # Should redirect to /students with a success flash
    wait_for(driver, By.ID, "students-table")
    assert "Selenium Tester" in driver.page_source, \
        "Newly added student 'Selenium Tester' not found in students list"


def test_07_duplicate_email_rejected(driver):
    """TC-07: Submit duplicate email and verify an error flash is shown."""
    navigate(driver, "/student/add")
    driver.find_element(By.ID, "name").send_keys("Duplicate User")
    driver.find_element(By.ID, "email").send_keys("selenium@test.com")
    driver.find_element(By.ID, "submit-student").click()
    time.sleep(0.5)
    assert "already exists" in driver.page_source.lower() or \
           "error" in driver.page_source.lower(), \
        "Expected duplicate email error not shown"



def test_08_add_task_form_renders(driver):
    """TC-08: Verify /task/add renders all required form fields."""
    navigate(driver, "/task/add")
    assert driver.find_element(By.ID, "title")      is not None
    assert driver.find_element(By.ID, "description") is not None
    assert driver.find_element(By.ID, "priority")    is not None
    assert driver.find_element(By.ID, "status")      is not None
    assert driver.find_element(By.ID, "student_id")  is not None



def test_09_add_task_success(driver):
    """TC-09: Submit a valid task and verify it appears in the task list."""
    navigate(driver, "/task/add")

    driver.find_element(By.ID, "title").send_keys("Selenium Test Task")
    driver.find_element(By.ID, "description").send_keys("Created by Selenium automated test")

    # Select first available student
    student_select = Select(driver.find_element(By.ID, "student_id"))
    student_select.select_by_index(1)

    Select(driver.find_element(By.ID, "priority")).select_by_value("high")
    Select(driver.find_element(By.ID, "status")).select_by_value("pending")

    driver.find_element(By.ID, "submit-task").click()
    wait_for(driver, By.ID, "tasks-table")
    assert "Selenium Test Task" in driver.page_source, \
        "Newly added task not found in tasks list"


def test_10_priority_badge_displayed(driver):
    """TC-10: Verify priority badges render on the tasks page."""
    navigate(driver, "/tasks")
    badges = driver.find_elements(By.CSS_SELECTOR, ".badge-high, .badge-medium, .badge-low")
    assert len(badges) > 0, "No priority badges found on tasks page"



def test_11_status_badge_displayed(driver):
    """TC-11: Verify status badges render on the tasks page."""
    navigate(driver, "/tasks")
    badges = driver.find_elements(By.CSS_SELECTOR,
        ".badge-pending, .badge-in-progress, .badge-completed")
    assert len(badges) > 0, "No status badges found on tasks page"


def test_12_student_detail_page(driver):
    """TC-12: Click on first student link and verify detail page loads."""
    navigate(driver, "/students")
    student_links = driver.find_elements(By.CSS_SELECTOR, "#students-table a")
    assert len(student_links) > 0, "No student links found in students table"
    student_links[0].click()
    time.sleep(0.5)
    assert "/student/" in driver.current_url, \
        f"Expected student detail URL, got: {driver.current_url}"


def test_13_edit_task_prefilled(driver):
    """TC-13: Verify the edit task page loads with existing task data pre-filled."""
    navigate(driver, "/tasks")
    edit_links = driver.find_elements(By.CSS_SELECTOR, "a.btn-primary.btn-sm")
    assert len(edit_links) > 0, "No edit links found in tasks table"
    edit_links[0].click()
    time.sleep(0.5)
    title_field = driver.find_element(By.ID, "title")
    assert title_field.get_attribute("value") != "", \
        "Title field is empty — task data not pre-filled"


def test_14_search_functionality(driver):
    """TC-14: Enter a search term and verify results section appears."""
    navigate(driver, "/search")
    search_input = driver.find_element(By.ID, "search-input")
    search_input.send_keys("Selenium")
    driver.find_element(By.ID, "search-btn").click()
    time.sleep(0.5)
    assert "Students" in driver.page_source and "Tasks" in driver.page_source, \
        "Search results section not displayed after search"



def test_15_health_endpoint(driver):
    """TC-15: Verify /health endpoint returns a 200 OK response."""
    navigate(driver, "/health")
    assert "ok" in driver.page_source.lower(), \
        "Health endpoint did not return expected 'ok' response"
