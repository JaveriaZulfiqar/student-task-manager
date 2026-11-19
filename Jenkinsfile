// Declarative pipeline. Everything runs in Docker, so the Jenkins host only needs
// Docker + Compose (see jenkins/Dockerfile for a ready-made controller image).
//
// Credentials expected in Jenkins (Manage Jenkins -> Credentials):
//   dockerhub-credentials  Username/password   (only needed to push on main)
//   stm-jwt-secret         Secret text         (JWT signing key used by the deployed app)
pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME  = 'javeriazulfiqarrr/student-task-manager'
        IMAGE_TAG   = "${env.BUILD_NUMBER}"
        CI_PROJECT  = "stm-ci-${env.BUILD_NUMBER}"
        E2E_PROJECT = "stm-e2e-${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --pretty="%h %an: %s"'
            }
        }

        stage('Test') {
            parallel {
                stage('Backend: lint + unit/integration tests') {
                    steps {
                        sh 'docker compose -p ${CI_PROJECT} -f docker-compose.ci.yml run --rm --build backend-tests'
                    }
                }
                stage('Frontend: lint + typecheck + unit tests') {
                    steps {
                        sh 'docker compose -p ${CI_PROJECT} -f docker-compose.ci.yml run --rm --build frontend-tests'
                    }
                }
            }
        }

        stage('Build image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Image vulnerability scan') {
            steps {
                // Fails the build on fixable CRITICAL vulnerabilities in the final image.
                sh '''
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:0.57.1 image --exit-code 1 --severity CRITICAL --ignore-unfixed \
                        --no-progress ${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('End-to-end tests (Selenium)') {
            steps {
                sh '''
                    mkdir -p test-results
                    JWT_SECRET=e2e-only-secret APP_PORT=5099 \
                    docker compose -p ${E2E_PROJECT} -f docker-compose.yml -f docker-compose.e2e.yml \
                        up --build --abort-on-container-exit --exit-code-from e2e
                '''
            }
        }

        stage('Push image') {
            when { branch 'main' }
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials',
                                                  usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    sh '''
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                withCredentials([string(credentialsId: 'stm-jwt-secret', variable: 'JWT_SECRET')]) {
                    sh '''
                        IMAGE_TAG=${IMAGE_TAG} docker compose -p stm-prod -f docker-compose.yml up -d --build
                        # Smoke test: the deployed app must report healthy and ready.
                        for i in $(seq 1 30); do
                            curl -fsS http://localhost:5000/ready && exit 0
                            sleep 2
                        done
                        echo "Deployment did not become ready" && exit 1
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker compose -p ${E2E_PROJECT} -f docker-compose.yml -f docker-compose.e2e.yml down -v || true'
            sh 'docker compose -p ${CI_PROJECT} -f docker-compose.ci.yml down -v || true'
            archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
            script {
                def email = sh(script: "git log -1 --format='%ae'", returnStdout: true).trim()
                if (email.contains('@')) {
                    emailext(
                        subject: "[Jenkins] ${currentBuild.currentResult}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: "Build ${currentBuild.currentResult}\nJob: ${env.JOB_NAME} #${env.BUILD_NUMBER}\nDetails: ${env.BUILD_URL}console",
                        to: email,
                        attachmentsPattern: 'test-results/report.html'
                    )
                }
            }
        }
        failure { echo 'Pipeline failed - nothing was deployed.' }
    }
}
