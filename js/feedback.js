
app.component('prmMainMenuAfter', {
    bindings: {
        parentCtrl: '<'
    },
    template: `
    <md-button aria-label="Send feedback"
               tabindex="0"
               class="zero-margin flex-button multi-line-button button-over-dark"
               layout="column"
               layout-align="center center"
               ng-click="$ctrl.displaySendFeedback()">

        <span class="item-content">feedback</span>
        <md-tooltip md-direction="down" md-delay="400" class="multi-row-tooltip slide-tooltip-anim">
            <span class="item-description popover animate-popover">FEEDBACK</span>
        </md-tooltip>
    </md-button>
    `,
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
                template: `
                <div layout="row" layout-wrap layout-margin layout-align="center">
                    <md-dialog id='lbsFeedbackForm' aria-label='feedback'>
                        <md-toolbar>
                            <div class="md-toolbar-tools">
                                <h2>Feedback</h2>
                                <span flex></span>
                                <md-button class="md-icon-button" ng-click="cancelSendFeedback()">
                                    <md-icon md-svg-icon="navigation:ic_close_24px" aria-label="Close dialog"></md-icon>
                                </md-button>
                            </div>
                        </md-toolbar>

                        <md-dialog-content>
                            <div class="md-dialog-content">
                                <input type="hidden" name='subject' ng-model='feedback.subject'>
                                <md-input-container class="md-block">
                                    <label>EMail</label>
                                    <input type="email" name='replyTo' title='Your email. So we can keep you up to date' placeholder='john.doe@kuleuven.be' required ng-model='feedback.replyTo'>
                                </md-input-container>

                                <md-input-container>
                                    <label>Description</label>
                                    <textarea name="message" placeholder="Describe what the problem is" md-maxlength="500" required md-no-asterisk rows="8" cols="80" ng-model="feedback.message"></textarea>
                                </md-input-container>
                            </div>
                        </md-dialog-content>

                        <md-dialog-actions layout="row">
                            <md-button class="md-raised" ng-click="cancelSendFeedback()">Cancel</md-button>
                            <md-button class="md-raised md-primary" ng-click='sendFeedback()'>Submit</md-button>
                        </md-dialog-actions>
                    </md-dialog>
                </div>
                `,
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
