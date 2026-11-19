# Test runner only - the browser lives in the `selenium` service (see docker-compose.e2e.yml),
# so this image needs no apt packages and builds in seconds.
FROM python:3.12-slim-bookworm
WORKDIR /tests
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python3", "-m", "pytest", ".", "-v", "--html=test-results/report.html", "--self-contained-html"]
