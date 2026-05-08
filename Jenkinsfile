pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_NAME             = 'javeriazulfiqarrr/student-task-manager-backend'
        APP_URL                = 'http://localhost:5000'
    }

    stages {

        stage('Clone Repository') {
            steps {
                echo 'Cloning repository from GitHub...'
                checkout scm
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building React frontend...'
                dir('student-task-manager-frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
                sh 'cp -r student-task-manager-frontend/dist student-task-manager-backend/backend/dist'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} student-task-manager-backend/backend/'
                sh 'docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Pushing image to Docker Hub...'
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh 'docker push ${IMAGE_NAME}:${BUILD_NUMBER}'
                sh 'docker push ${IMAGE_NAME}:latest'
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Deploying application via Docker Compose...'
                sh 'docker compose -f docker-compose-jenkins.yml down || true'
                sh 'docker compose -f docker-compose-jenkins.yml up -d'
                echo 'Waiting for app to be ready...'
                sh 'sleep 15'
            }
        }

        stage('Run Selenium Tests') {
            steps {
                echo 'Cloning test repository and running Selenium tests...'
                sh '''
                    rm -rf selenium-tests-repo
                    git clone https://github.com/JaveriaZulfiqar/student-task-manager-tests.git selenium-tests-repo

                    pip3 install selenium pytest pytest-html --break-system-packages --quiet 2>/dev/null || true

                    if ! command -v google-chrome &> /dev/null; then
                        wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
                        sudo apt-get install -y ./google-chrome-stable_current_amd64.deb 2>/dev/null || true
                        rm -f google-chrome-stable_current_amd64.deb
                    fi

                    mkdir -p test-results
                    BASE_URL=${APP_URL} python3 -m pytest selenium-tests-repo/ \
                        -v --tb=short \
                        --html=test-results/report.html \
                        --self-contained-html \
                        --junitxml=test-results/results.xml \
                        2>&1 | tee test-results/test-output.txt || true
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'test-results/results.xml'
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
                }
            }
        }

        stage('Teardown') {
            steps {
                echo 'Stopping application containers...'
                sh 'docker compose -f docker-compose-jenkins.yml down || true'
            }
        }
    }

    post {
        always {
            script {
                def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'
                def pusherEmail = ''
                try {
                    pusherEmail = sh(script: "git log -1 --format='%ae'", returnStdout: true).trim()
                } catch (e) {
                    pusherEmail = 'javeriazulfiqar45@gmail.com'
                }
                def subject = "[Jenkins] ${buildStatus}: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                def body = """
Hello,

Your push to Student Task Manager triggered the Jenkins pipeline.

Result:       ${buildStatus}
Job:          ${env.JOB_NAME}
Build Number: #${env.BUILD_NUMBER}
Duration:     ${currentBuild.durationString}
Build URL:    ${env.BUILD_URL}

Selenium test report is attached.

Regards,
Jenkins CI - COMSATS DevOps Pipeline
"""
                try {
                    emailext(subject: subject, body: body, to: pusherEmail,
                             attachmentsPattern: 'test-results/report.html')
                } catch (e) { echo "Email to pusher failed: ${e.message}" }
            }
        }
    }
}
