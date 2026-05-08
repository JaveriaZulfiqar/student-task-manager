pipeline {
    agent any

    options {
        timeout(time: 10, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code checked out successfully.'
            }
        }

        stage('Build') {
            steps {
                echo 'Building application...'
                // Replace with your actual build command, e.g.:
                // sh 'npm install && npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running Selenium tests...'
                // Replace with your actual test command inside Docker, e.g.:
                // sh 'docker run --rm -v $(pwd):/app markhobson/maven-chrome mvn test'
            }
        }
    }

    post {
        always {
            script {
                def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'

                // Get the pusher email from the git log — no separate node() needed
                // because we are already inside the agent's node context
                def pusherEmail = ''
                try {
                    pusherEmail = sh(
                        script: "git log -1 --format='%ae'",
                        returnStdout: true
                    ).trim()
                    echo "Pusher email: ${pusherEmail}"
                } catch (e) {
                    echo "Could not retrieve pusher email: ${e.message}"
                }

                if (pusherEmail?.contains('@')) {
                    emailext(
                        subject: "[Jenkins] ${buildStatus}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: """
Build Status : ${buildStatus}
Job Name     : ${env.JOB_NAME}
Build Number : ${env.BUILD_NUMBER}
Triggered by : ${pusherEmail}
Console URL  : ${env.BUILD_URL}console
                        """,
                        to: pusherEmail
                    )
                    echo "Email sent to: ${pusherEmail}"
                } else {
                    echo 'No valid pusher email found — skipping email notification.'
                }
            }
        }
    }
}
