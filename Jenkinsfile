pipeline {
    agent any

    options {
        timeout(time: 15, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Application code checked out.'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose -f docker-compose.yml up -d'
                echo 'Application deployed.'
            }
        }

        stage('Test') {
            steps {
                sh '''
                    # Clone the test repo
                    rm -rf test-repo
                    git clone https://github.com/JaveriaZulfiqar/student-task-manager-tests.git test-repo

                    # Build the test Docker image
                    docker build -t selenium-tests ./test-repo/selenium-tests

                    # Run the tests
                    docker run --rm \
                        --network student-task-manager-v2_app-network \
                        -v $(pwd)/test-results:/tests/test-results \
                        selenium-tests \
                        python3 -m pytest . -v --html=test-results/report.html --self-contained-html
                '''
            }
        }
    }

    post {
        always {
            script {
                def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'
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
                        to: pusherEmail,
                        attachmentsPattern: 'test-results/report.html'
                    )
                    echo "Email sent to: ${pusherEmail}"
                }
            }
        }

        success {
            echo 'Pipeline completed successfully!'
        }

        failure {
            sh 'docker compose -f docker-compose.yml down || true'
            echo 'Pipeline failed — deployment stopped.'
        }
    }
}
