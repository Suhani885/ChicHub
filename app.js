const app = angular.module('myapp', ['ui.router']);
var baseUrl = 'https://192.168.148.241:8000';

app.config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.otherwise('/login');
    
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'login.html',
            controller: 'LoginController',
            controllerAs: 'loginCtrl'
        })
        .state('register', {
            url: '/register',
            templateUrl: 'register.html',
            controller: 'RegController',
            controllerAs: 'regCtrl'
        })
        .state('main', {
            url: '/main',
            templateUrl: 'main.html',
            controller: 'MainController',
            controllerAs: 'mainCtrl'
        })
        .state('admin', {
            url: '/admin',
            templateUrl: 'admin.html',
            controller: 'AdminController',
            controllerAs: 'admCtrl'
        });

}]);

app.controller('RegController', ['$http', '$state', function ($http, $state) {
    var regCtrl = this;
    regCtrl.register = function() {
        console.log(regCtrl.fname, regCtrl.lname, regCtrl.email, regCtrl.number, regCtrl.pass1, regCtrl.pass2);
        if (regCtrl.pass1 !== regCtrl.pass2) {
            regCtrl.errorMessage = "Passwords do not match";
            return;
        }
        var req = {
            method: 'POST',
            url:`${baseUrl}/chichub/registration/`,
            data: {
                "first_name": regCtrl.fname,
                "last_name": regCtrl.lname,
                "email": regCtrl.email,
                "phone_number": regCtrl.number,
                "password1": regCtrl.pass1,
                "password2": regCtrl.pass2
            }
        };
        $http(req).then(function(response) {
            console.log(response);
            window.alert("Registration successful");
            $state.go('login');
        }, function(error) {
            if (error.status === 400) {
                regCtrl.errorMessage = "Already registered!";
            } else if (error.status === 409) {
                regCtrl.errorMessage = "Username or email already exists. Please choose a different one.";
            } else if (error.status === 500) {
                regCtrl.errorMessage = "Server error. Please try again later!";
            } else {
                regCtrl.errorMessage = "An unexpected error occurred. Please try again!";
            }
            console.log("error", error);
        });
    };
}]);

app.controller('LoginController', ['$http','$state', function ($http,$state) {
    var loginCtrl = this;
    loginCtrl.login = function() {
        console.log(loginCtrl.email, loginCtrl.password);
        if (loginCtrl.email && loginCtrl.password) {
            var req = {
                method: 'POST',
                url:`${baseUrl}/chichub/login/`,
                withCredentials: true,
                headers: {
                    'Content-Type': "application/json"
                },
                data: {
                    "email": loginCtrl.email,
                    "password": loginCtrl.password
                }
            };
            $http(req).then(function(response) {
                console.log(response);
                window.alert("Login successful");
                sessionStorage.setItem('email', loginCtrl.email);
                if ("superuserAuthenticated" == true){
                    $state.go('admin');
                } else {
                    $state.go('admin');
                }
            }, function(error) {
                if (error.status === 400) {
                    loginCtrl.errorMessage = "Invalid username or password. Please check your information and try again.";
                } else if (error.status === 500) {
                    loginCtrl.errorMessage = "Server error. Please try again later!";
                } else {
                    loginCtrl.errorMessage = "An unexpected error occurred. Please try again!";
                }
                console.log("error", error);
            });
        }
    };
}]);

app.controller('AdminController', ['$http', '$state', function ($http, $state) {
    var admCtrl = this;
}]);

app.controller('MainController', ['$http', '$state', function($http, $state) {
    var mainCtrl = this;
    mainCtrl.email = sessionStorage.getItem('email');

    mainCtrl.logout = function() {
        var req = {
            method: 'POST',
            url: `${baseUrl}/chichub/logout/`,
            withCredentials: true
        };
        if (confirm("Are you sure you want to logout?")) {
            $http(req).then(function(response) {
                console.log(response);
                sessionStorage.removeItem('email');
                $state.go('login');
            }, function(error) {
                console.log("error", error);
            });
        }
    };
    

    // mainCtrl.fetchProds = function() {
    //     var req = {
    //         method: 'GET',
    //         url: `${baseUrl}/chichub/category/`,
    //         withCredentials: true
    //     };
    //     $http(req).then(function(response) {
    //         console.log(response);
    //         mainCtrl.todos = response.data.categories;
    //         console.log(response.data.categories);
    //     }, function(error) {
    //         console.log("Error", error);
    //     });
    // };
    // mainCtrl.fetchProds();
// }]);


//     mainCtrl.categories = [
//         { name: 'Earrings', images: [] },
//         { name: 'Bracelets', images: [] },
//         { name: 'Rings', images: [] },
//         { name: 'Necklaces', images: [] },
//         { name: 'Chains', images: [] },
//         { name: 'Anklets', images: [] }
//     ];

//     mainCtrl.fetch = function(category) {
//         var req = {
//             method: 'GET',
//             url: `${baseUrl}/images/`,
//             withCredentials: true
//         };
        
//         $http(req).then(function(response) {
//             console.log(response);
//             category.images = response.data.categories; 
//         }, function(error) {
//             console.log(error);
//         });
//     };

//     mainCtrl.fetchAll = function() {
//         mainCtrl.categories.forEach(function(category) {
//             mainCtrl.fetch(category);
//         });
//     };
//     mainCtrl.fetchAll();
}]);





