pipeline {
    agent any
    options {
        timeout(time: 5, unit: 'MINUTES') // Don't let it hang
    }
    stages {
        stage('Initialize') {
            steps {
                echo 'Waking up Jenkins...'
                sh 'git log -1' // Force a workspace check here
            }
        }
    }
    post {
        always {
            // We use 'node' here to give 'sh' a place to live
            node('built-in') { 
                script {
                    def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'
                    def pusherEmail = ""
                    try {
                        pusherEmail = sh(script: "git log -1 --format='%ae'", returnStdout: true).trim()
                        echo "Commit detected from: ${pusherEmail}"
                    } catch (e) {
                        echo "Could not find pusher email. Error: ${e.message}"
                    }

                    if (pusherEmail && pusherEmail.contains("@")) {
                        emailext(
                            subject: "[Jenkins] ${buildStatus}: ${env.JOB_NAME}",
                            body: "Build Result: ${buildStatus}\nURL: ${env.BUILD_URL}",
                            to: pusherEmail,
                            attachmentsPattern: 'test-results/report.html'
                        )
                    }
                }
            }
        }
    }
}
