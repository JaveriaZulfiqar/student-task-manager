pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        // Add your Build or Test stages here if they are missing
    }

    post {
        always {
            script {
                def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'
                def pusherEmail = ""
                
                try {
                    // This command gets the email of the actual person who made the commit
                    pusherEmail = sh(script: "git log -1 --format='%ae'", returnStdout: true).trim()
                    echo "Commit detected from: ${pusherEmail}"
                } catch (e) {
                    echo "Could not find pusher email. Error: ${e.message}"
                }

                // VALIDATION: Only send if we actually found an email address
                if (pusherEmail && pusherEmail.contains("@")) {
                    def subject = "[Jenkins] ${buildStatus}: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                    def body = """
Hello,

Your push to Student Task Manager triggered the Jenkins pipeline.

Result:       ${buildStatus}
Job:           ${env.JOB_NAME}
Build Number: #${env.BUILD_NUMBER}
Build URL:     ${env.BUILD_URL}

The Selenium test report is attached.

Regards,
Jenkins CI - COMSATS DevOps Pipeline
"""
                    emailext(
                        subject: subject, 
                        body: body, 
                        to: pusherEmail,
                        attachmentsPattern: 'test-results/report.html'
                    )
                } else {
                    echo "Email was not sent because the pusher email could not be determined."
                }
            }
        }
    }
}
