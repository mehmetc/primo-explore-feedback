
app.component('prmMainMenuAfter', {
    bindings: {
        parentCtrl: '<'
    },
    templateUrl: `custom/${window.appConfig['vid']}/html/feedback_button.html`,
    controller: ['$mdToast', '$localForage', '$mdDialog', '$http', function($mdToast, $localForage, $mdDialog, $http) {
        var self = this;
        var uSms = this.parentCtrl.userSessionManagerService;

        self.$onInit = function() {
            self.session = session(uSms);
            if (typeof feedbackServiceURL === 'undefined') {
              self.displaySendFeedback = function(){
                alert('Please set the "feedbackServiceURL" variable');
              }
            } else {
                self.displaySendFeedback = displaySendFeedback;
            }            
        }

        var displaySendFeedback = function() {
            $mdDialog.show({
                templateUrl: `custom/${window.appConfig['vid']}/html/feedback_form.html`,
                controller: function($scope, $mdDialog) {
                    $scope.feedback = {
                        replyTo: (self.session.user.email || ''),
                        message: '',
                        subject: 'feedback'
                    };

                    $scope.cancelSendFeedback = function() {
                        $mdDialog.cancel();
                    };

                    $scope.sendFeedback = function(answer) {
                        let data = {
                            subject: $scope.feedback.subject,
                            sessionId: self.session.id,
                            view: self.session.view.code,
                            inst: self.session.view.institution.code,
                            loggedIn: self.session.user.isLoggedIn(),
                            onCampus: self.session.user.isOnCampus(),
                            user: self.session.user.name,
                            ip: self.session.ip.address,
                            type: 'feedback',
                            feedback: $scope.feedback.message,
                            email: $scope.feedback.replyTo,
                            userAgent: navigator.userAgent
                        };

                        //$http is not usable today because of a sticky Authorization header
                        let request = new Request(feedbackServiceURL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            mode: 'cors',
                            cache: 'no-cache',
                            body: JSON.stringify(data)
                        });
                        fetch(request)
                            .then((response) => {
                                $mdToast.showSimple('Thank you for your feedback!');
                            }, (response) => {
                                console.log(response);
                                $mdToast.showSimple('submitting feedback');
                            });

                        $mdDialog.hide(answer);
                    };
                },
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                fullscreen: false
            }).then(function() {
                console.log('Feedback handeled');
            }, function() {
                console.log('Cancelling feedback');
            });
        }

        var session = function(uSms) {
            let jwtData = uSms.jwtUtilService.getDecodedToken();
            let s = {
                id: jwtData.jti,
                view: {
                    code: jwtData.viewId,
                    institution: {
                        code: jwtData.viewInstitutionCode || window.appConfig['vid'],
                        name: window.appConfig['primo-view']['attributes-map'].institution
                    },
                    interfaceLanguage: ''
                },
                ip: {
                    address: jwtData.ip
                },
                user: {
                    id: jwtData.user || '',
                    email: '',
                    name: jwtData.userName || 'Guest',
                    isLoggedIn: function() {
                        return uSms.getUserName().length > 0
                    },
                    isOnCampus: function() {
                        return jwtData.onCampus == "true"
                    }
                }
            }

            $localForage.getItem('userDetails').then(function(data) {
                s.user.email = data ? data.email : ''
                s.view.interfaceLanguage = data ? data.interfaceLanguage : '';
            });
            return s
        }
    }]
});
