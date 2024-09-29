const chichub = angular.module('chichub', ['ui.router']);
var baseUrl = 'https://10.21.96.239:8000';

chichub.config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.otherwise('/login');
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'templateFiles/login.html',
            controller: 'LoginController',
            controllerAs: 'loginCtrl'
        })
        .state('register', {
            url: '/register',
            templateUrl: 'templateFiles/register.html',
            controller: 'RegController',
            controllerAs: 'regCtrl'
        })
        .state('main', {
            url: '/main',
            templateUrl: 'templateFiles/main.html',
            controller: 'MainController',
            controllerAs: 'mainCtrl'
        })
        .state('category', {
            url: '/category',
            templateUrl: 'templateFiles/category.html',
            controller: 'CategController',
            controllerAs: 'categCtrl'
        })
        .state('cart', {
            url: '/cart',
            templateUrl: 'templateFiles/cart.html',
            controller: 'CartController',
            controllerAs: 'cartCtrl'
        })
        .state('product', {
            url: '/product',
            templateUrl: 'templateFiles/products.html',
            controller: 'ProductController',
            controllerAs: 'prodCtrl'
        })
        .state('admin', {
            url: '/admin',
            templateUrl: 'templateFiles/admin.html',
            controller: 'AdminController',
            controllerAs: 'admCtrl'
        });

}]);

chichub.controller('RegController', ['$http', '$state', function ($http, $state) {
    var regCtrl = this;
    regCtrl.register = function() {
        console.log(regCtrl.fname, regCtrl.lname, regCtrl.email, regCtrl.number, regCtrl.pass1, regCtrl.pass2);
        if (regCtrl.pass1 !== regCtrl.pass2) {
            regCtrl.errorMessage = "Passwords do not match";
            return;
        }
        var req = {
            method: 'POST',
            url:`${baseUrl}/accounts/registration/`,
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

chichub.controller('LoginController', ['$http', '$state', function ($http, $state) {
    var loginCtrl = this;
    loginCtrl.login = function() {
        console.log(loginCtrl.email, loginCtrl.password);
        if (loginCtrl.email && loginCtrl.password) {
            var req = {
                method: 'POST',
                url: `${baseUrl}/accounts/login/`,
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
                if (response.data.superuserAuthenticated === true) {
                    sessionStorage.setItem('isSuperuser', 'true');
                    $state.go('main');
                // } else {
                //     sessionStorage.setItem('isSuperuser', 'false');
                //     $state.go('main');  
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

chichub.controller('AdminController', ['$http', '$state', function ($http, $state) {
    var admCtrl = this;
    admCtrl.superusers = [];
    admCtrl.users = [];

    admCtrl.fetchUsers = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/admin/home/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log(response);
            admCtrl.superusers = response.data.SuperUserDetails || [];
            console.log(response.data.SuperUserDetails);
            admCtrl.users = response.data.NormalUserDetails || [];
            console.log(response.data.NormalUserDetails);
        }, function(error) {
            console.log("Error", error);
        });
    };
            
    admCtrl.makeAdmin = function(userId) {
        if (confirm("Are you sure you want to make this user an admin?")) {
            var req = {
                method: 'POST',
                url: `${baseUrl}/store-app/make-admin/`,
                withCredentials: true,
                data: {
                    "id": userId
                }
            };
            $http(req).then(function(response) {
                console.log(response);
                    alert('User has been made an admin successfully');
                    admCtrl.fetchUsers();
                }, function(error) {
                    console.error(error);
                    alert('Failed to make user an admin');
            });
        }
    };

    admCtrl.deleteUser = function(userId) {
        if (confirm("Are you sure you want to delete this user?")) {
            var req = {
                method: 'DELETE',
                url: `${baseUrl}/store-app/delete-user/`,
                withCredentials: true,
                data: {
                    "id": userId
                }
            };
            $http(req).then(function(response) {
                console.log(response);
                    alert("User has been deleted successfully");
                    admCtrl.fetchUsers();
                }, function(error) {
                    console.error(error);
                    alert("Failed to delete user");
                    admCtrl.errorMessage = "You cannot delete the OWNER!";
            });
        }
    };

    admCtrl.logout = function() {
        var req = {
            method: 'POST',
            url: `${baseUrl}/accounts/logout/`,
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

    admCtrl.fetchUsers();
}]);

chichub.controller('CategController', ['$http', function($http) {
    var categCtrl = this;
    categCtrl.categories = [];
    categCtrl.newCategory = {};
    categCtrl.newImage = null;

    categCtrl.getImageUrl = function(imagePath) {
        return baseUrl + '/media/' + imagePath;
    };

    categCtrl.fetchCategories = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/categories/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log(response);
            categCtrl.categories = response.data.Category_Details;
        }, function(error) {
            console.error('Error fetching categories:', error);
        });
    };

    categCtrl.img = function(element) {
        categCtrl.newCategory.image = element.files[0];
    };
    
    categCtrl.addCategory = function() {
        var formData = new FormData();
        formData.append('category_name', categCtrl.newCategory.name);
        formData.append('category_description', categCtrl.newCategory.description);
        formData.append('category_image', categCtrl.newCategory.image);
    
        var req = {
            method: 'POST',
            url: `${baseUrl}/store-app/categories/create/`,
            headers: {'Content-Type': undefined},
            data: formData,
            withCredentials: true
        };
    
        $http(req).then(function(response) {
            console.log(response);
            alert("Category has been added successfully");
            categCtrl.fetchCategories();
            categCtrl.newCategory = {};
        }, function(error) {
            console.error('Error adding category:', error);
            alert('Failed to add category!');
        });
    };

    categCtrl.deleteCategory = function(categoryId) {
        if (confirm('Are you sure you want to delete this category?')) {
            var req = {
                method: 'DELETE',
                url: `${baseUrl}/store-app/categories/delete/`,
                withCredentials: true,
                data: {
                    "category_id": categoryId
                }
            };
            $http(req).then(function(response) {
                console.log(response);
                    alert("Category has been deleted successfully");
                    categCtrl.fetchCategories();
                }, function(error) {
                    console.error('Error deleting category:', error);
                    alert('Failed to delete category!');
            });
        }
    };

    categCtrl.fetchCategories();
}]);

chichub.controller('MainController', ['$http', '$state', function($http, $state) {
    var mainCtrl = this;
    mainCtrl.email = sessionStorage.getItem('email');
    mainCtrl.categories = [];

    mainCtrl.logout = function() {
        var req = {
            method: 'POST',
            url: `${baseUrl}/accounts/logout/`,
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

    mainCtrl.fetchCategories = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/categories/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log(response);
            mainCtrl.categories = response.data.Category_Details;
        }, function(error) {
            console.error('Error fetching categories:', error);
        });
    };

    mainCtrl.getImageUrl = function(imagePath) {
        return baseUrl + '/media/' + imagePath;
    };

    mainCtrl.fetchCategories();
}]);

chichub.controller('ProductController', ['$http', function($http) {
    var prodCtrl = this;
    prodCtrl.categories = [];

    prodCtrl.fetchProducts = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/products/`,
            withCredentials: true,
            data: {
                "category_id": categoryId
            }
        };
        $http(req).then(function(response) {
            console.log(response);
            prodCtrl.products = response.data.Product_Details;
        }, function(error) {
            console.error('Error fetching categories:', error);
        });
    };

    prodCtrl.getImageUrl = function(imagePath) {
        return baseUrl + '/media/' + imagePath;
    };

    mainCtrl.fetchProducts();
}]);



