'use strict';

/* Custom Services */

jhipsterApp.factory('ProjectService', ['$resource',
    function ($resource) {
        return $resource('app/rest/project', {}, {
        	'get': { method: 'GET', isArray: true}
        });
    }]);
    

jhipsterApp.factory('SuiteService', ['$rootScope', '$http', '$resource',
      function ($rootScope, $http, $resource) {
          return {
        	  findById: function(suiteId) {
                  var suite = $http.get('app/rest/suite/' + suiteId)
                  	.success(function (data) {
                	    console.log("$scope.suite() applied, refreshing tests");
                	    $rootScope.suite = data;
                	    $rootScope.tests = $rootScope.suite.tests;
	                   	console.log("$scope.tests available as:");
	                   	console.log($rootScope.tests);
                  });
                  /*.then(function (response) {
                      return response.data;
                  });
                  return suite;*/
        	  },
              findAll: function() {
            	   var data = $http.get('app/rest/suite/')
            	   	.then(function (response){
            	   		return response.data;
            	   });
            	   return data;
              }
          };
      }]);

/*
 * Using http://stackoverflow.com/questions/12505760/angularjs-processing-http-response-in-service/12513509#12513509
 * example to return a promise service
 * and be able to pass a function from controller side to handle response
 * as discussed in http://stackoverflow.com/questions/15666048/angular-js-service-vs-provider-vs-factory
 */
jhipsterApp.factory('TestService', ['$rootScope', '$http', '$resource',
    function ($rootScope, $http, $resource) {
		var testService = {
			findById: function(testId) {
				var promise = $http.get('app/rest/test/' + testId)
					.then(function(response){
						console.log(response);
						return response.data;
				});
				return promise;
			}
		};
		return testService;
	}]);               
			
		/*function(testId) {
			this.test = $http.get('app/rest/test/' + testId)
            	.success(function (data) {
	          	    console.log("$scope.test() applied, refreshing test");
	          	    return data;
			});
            return this.test;
		};*/
		
	    /*return {
	  	  findById: function(testId) {
	            var test = $http.get('app/rest/test/' + testId)
	            	.success(function (data) {
		          	    console.log("$scope.test() applied, refreshing test");
		          	    return data;
	            });
	            return test;
	  	  },
	      findAll: function() {
	      	   var data = $http.get('app/rest/test/name')
	      	   	.then(function (response){
	      	   		return response.data;
	      	   });
	      	   return data;
	      }
	    };*/

/*************************** 
 *     Default Services 
 * *************************/

jhipsterApp.factory('Account', ['$resource',
    function ($resource) {
        return $resource('app/rest/account', {}, {
        });
    }]);

jhipsterApp.factory('Password', ['$resource',
    function ($resource) {
        return $resource('app/rest/account/change_password', {}, {
        });
    }]);

jhipsterApp.factory('Sessions', ['$resource',
    function ($resource) {
        return $resource('app/rest/account/sessions/:series', {}, {
            'get': { method: 'GET', isArray: true}
        });
    }]);

jhipsterApp.factory('MetricsService', ['$resource',
    function ($resource) {
        return $resource('metrics/metrics', {}, {
            'get': { method: 'GET'}
        });
    }]);

jhipsterApp.factory('ThreadDumpService', ['$http',
    function ($http) {
        return {
            dump: function() {
                var promise = $http.get('dump').then(function(response){
                    return response.data;
                });
                return promise;
            }
        };
    }]);

jhipsterApp.factory('HealthCheckService', ['$rootScope', '$http',
    function ($rootScope, $http) {
        return {
            check: function() {
                var promise = $http.get('health').then(function(response){
                    return response.data;
                });
                return promise;
            }
        };
    }]);

jhipsterApp.factory('LogsService', ['$resource',
    function ($resource) {
        return $resource('app/rest/logs', {}, {
            'findAll': { method: 'GET', isArray: true},
            'changeLevel':  { method: 'PUT'}
        });
    }]);

jhipsterApp.factory('AuditsService', ['$http',
    function ($http) {
        return {
            findAll: function() {
                var promise = $http.get('app/rest/audits/all').then(function (response) {
                    return response.data;
                });
                return promise;
            },
            findByDates: function(fromDate, toDate) {
                var promise = $http.get('app/rest/audits/byDates', {params: {fromDate: fromDate, toDate: toDate}}).then(function (response) {
                    return response.data;
                });
                return promise;
            }
        }
    }]);

jhipsterApp.factory('Session', ['$cookieStore',
    function ($cookieStore) {
        this.create = function (login, firstName, lastName, email, userRoles) {
            this.login = login;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.userRoles = userRoles;
        };
        this.destroy = function () {
            this.login = null;
            this.firstName = null;
            this.lastName = null;
            this.email = null;
            this.roles = null;
            $cookieStore.remove('account');
        };
        return this;
    }]);

jhipsterApp.constant('USER_ROLES', {
        all: '*',
        admin: 'ROLE_ADMIN',
        user: 'ROLE_USER'
    });

jhipsterApp.factory('AuthenticationSharedService', ['$rootScope', '$http', '$cookieStore', 'authService', 'Session', 'Account',
    function ($rootScope, $http, $cookieStore, authService, Session, Account) {
        return {
            login: function (param) {
                var data ="j_username=" + param.username +"&j_password=" + param.password +"&_spring_security_remember_me=" + param.rememberMe +"&submit=Login";
                $http.post('app/authentication', data, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    ignoreAuthModule: 'ignoreAuthModule'
                }).success(function (data, status, headers, config) {
                    Account.get(function(data) {
                        Session.create(data.login, data.firstName, data.lastName, data.email, data.roles);
                        $cookieStore.put('account', JSON.stringify(Session));
                        authService.loginConfirmed(data);
                    });
                }).error(function (data, status, headers, config) {
                    Session.destroy();
                });
            },
            isAuthenticated: function () {
                if (!Session.login) {
                    // check if the user has a cookie
                    if ($cookieStore.get('account') != null) {
                        var account = JSON.parse($cookieStore.get('account'));
                        Session.create(account.login, account.firstName, account.lastName,
                            account.email, account.userRoles);
                        $rootScope.account = Session;
                    }
                }
                return !!Session.login;
            },
            isAuthorized: function (authorizedRoles) {
                if (!angular.isArray(authorizedRoles)) {
                    if (authorizedRoles == '*') {
                        return true;
                    }

                    authorizedRoles = [authorizedRoles];
                }

                var isAuthorized = false;

                angular.forEach(authorizedRoles, function(authorizedRole) {
                    var authorized = (!!Session.login &&
                        Session.userRoles.indexOf(authorizedRole) !== -1);

                    if (authorized || authorizedRole == '*') {
                        isAuthorized = true;
                    }
                });

                return isAuthorized;
            },
            logout: function () {
                $rootScope.authenticationError = false;
                $http.get('app/logout')
                    .success(function (data, status, headers, config) {
                        Session.destroy();
                        authService.loginCancelled();
                    });
            }
        };
    }]);
