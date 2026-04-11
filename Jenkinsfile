pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_NAME = 'javeriazulfiqarrr/student-task-manager-backend'
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

        stage('Deploy with Docker Compose') {
            steps {
                echo 'Deploying application...'
                sh 'docker compose -f docker-compose-jenkins.yml up -d --build'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! App is running.'
        }
        failure {
            echo 'Pipeline failed. Check logs above.'
        }
    }
}
