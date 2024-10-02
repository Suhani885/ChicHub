const chichub = angular.module('chichub', ['ui.router']);
var baseUrl = 'https://10.21.96.172:8000';

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
        .state('front', {
            url: '/front',
            templateUrl: 'templateFiles/front.html',
            controller: 'FrontController',
            controllerAs: 'frontCtrl'
        })
        .state('main', {
            url: '/main',
            templateUrl: 'templateFiles/main.html',
            controller: 'MainController',
            controllerAs: 'mainCtrl'
        })
        .state('checkout', {
            url: '/checkout',
            templateUrl: 'templateFiles/checkout.html',
            controller: 'CheckoutController',
            controllerAs: 'checkoutCtrl'
        })
        .state('productView', {
            url: '/product-view',
            templateUrl: 'templateFiles/prodView.html',
            controller: 'ProdViewController as prodViewCtrl',
        })
        .state('admin', {
            url: '/admin',
            templateUrl: 'templateFiles/admin.html',
            controller: 'AdminController',
            controllerAs: 'admCtrl'
        });

}]);

chichub.run(['$rootScope', '$state', '$window', function($rootScope, $state, $window) {
    $rootScope.$on('$locationChangeStart', function(event, newUrl) {
      var isLoggedIn = $window.sessionStorage.getItem('isUser') === 'true';
      var isSuperuser = $window.sessionStorage.getItem('isSuperuser') === 'true';
      
      var targetState = getStateFromUrl(newUrl);
      
      if (targetState === 'admin' && !isSuperuser) {
        event.preventDefault();
        $state.go('login');
        Swal.fire({
            title: 'Authentication Required',
            text: 'Please login as a superuser to access this page.',
            icon: 'warning',
            confirmButtonText: 'Go to Login'
        })
      } else if (targetState === 'cart' && !isLoggedIn) {
        event.preventDefault();
        $state.go('login');
        Swal.fire({
            title: 'Authentication Required',
            text: 'Please login as a user to access the cart.',
            icon: 'warning',
            confirmButtonText: 'Go to Login'
        })
      }
    });
    
    function getStateFromUrl(url) {
      if (url.includes('/admin')) return 'admin';
      if (url.includes('/cart')) return 'cart';
      return null;
    }
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
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Registration successful'
            }).then(() => {
                $state.go('login');
            });
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
                if (response.data.message === "Super user is authenticated") {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Superuser login successful'
                    }).then(() => {
                        sessionStorage.setItem('email', loginCtrl.email);
                        sessionStorage.setItem('isSuperuser', 'true');
                        $state.go('admin');
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'User Login Successful'
                    }).then(() => {
                        sessionStorage.setItem('email', loginCtrl.email);
                        sessionStorage.setItem('isUser', 'true');
                        $state.go('front');
                    });
                }
            }, function(error) { 
                console.log("error", error);
                if (error.status === 400) {
                    loginCtrl.errorMessage = "Invalid username or password. Please check your information and try again.";
                } else if (error.status === 500) {
                    loginCtrl.errorMessage = "Server error. Please try again later!";
                } else {
                    loginCtrl.errorMessage = "An unexpected error occurred. Please try again!";
                }
            });
        } else {
            loginCtrl.errorMessage = "Please enter both email and password.";
        }
    };
}]);

chichub.controller('AdminController', ['$http', '$state','$window', function ($http, $state,$window) {
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
        Swal.fire({
            title: 'Are you sure?',
            text: "You're about to make this user an admin!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, make admin!'
        }).then((result) => {
            if (result.isConfirmed) {
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
                    Swal.fire(
                        'Success!',
                        'User has been made an admin successfully.',
                        'success'
                    );
                    admCtrl.fetchUsers();
                }, function(error) {
                    console.error(error);
                    Swal.fire(
                        'Failed!',
                        'Failed to make user an admin.',
                        'error'
                    );
                });
            }
        });
    };

    admCtrl.deleteUser = function(userId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
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
                    Swal.fire(
                        'Deleted!',
                        'User has been deleted successfully.',
                        'success'
                    );
                    admCtrl.fetchUsers();
                }, function(error) {
                    console.error(error);
                    Swal.fire(
                        'Failed!',
                        'You cannot delete the OWNER!',
                        'error'
                    );
                });
            }
        });
    };

    admCtrl.logout = function() {
        Swal.fire({
            title: 'Are you sure?',
            text: "You're about to log out!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, log out!'
        }).then((result) => {
            if (result.isConfirmed) {
                var req = {
                    method: 'POST',
                    url: `${baseUrl}/accounts/logout/`,
                    withCredentials: true
                };
                $http(req).then(function(response) {
                    console.log(response);
                    sessionStorage.removeItem('email');
                    Swal.fire(
                        'Logged Out!',
                        'You have been successfully logged out.',
                        'success'
                    ).then(() => {
                        $state.go('login');
                    });
                }, function(error) {
                    console.log("error", error);
                    Swal.fire(
                        'Error!',
                        'Failed to log out. Please try again.',
                        'error'
                    );
                });
            }
        });
    };

    admCtrl.fetchUsers();
}]);

chichub.controller('CategController', ['$http', function($http) {
    var categCtrl = this;
    categCtrl.categories = [];
    categCtrl.newCategory = {};
    categCtrl.products = []; 
    categCtrl.newProduct = {};
    categCtrl.currentCategoryId = null;

    categCtrl.getImageUrl = function(imagePath) {
        return baseUrl + '/media/' + imagePath;
    };

    categCtrl.img = function(element) {
        categCtrl.newCategory.image = element.files[0];
    };

    categCtrl.productImg = function(element) {
        categCtrl.newProduct.image = element.files[0];
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

    categCtrl.fetchProducts = function(category) {
        var req = {
            method: 'POST',
            url: `${baseUrl}/store-app/products/`,
            data: {
                "category_id": category.id
            },
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log(response);
            categCtrl.products = response.data.Product_Details; 
        }, function(error) {
            console.error('Error fetching products:', error);
        });
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
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Category has been added successfully'
            });
            categCtrl.fetchCategories();
            categCtrl.newCategory = {};
        }, function(error) {
            console.error('Error adding category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to add category!'
            });
        });
    };

    categCtrl.addProduct = function() {
        if (!categCtrl.currentCategoryId) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please select a category first'
            });
            return;
        }

        var formData = new FormData();
        formData.append('product_name', categCtrl.newProduct.name);
        formData.append('product_description', categCtrl.newProduct.description);
        formData.append('image', categCtrl.newProduct.image);
        formData.append('price_quantity', categCtrl.newProduct.price);
        formData.append('stock_keeping_unit', categCtrl.newProduct.quantity);
        formData.append('category_id', categCtrl.currentCategoryId);
    
        var req = {
            method: 'POST',
            url: `${baseUrl}/store-app/products/add/`,
            headers: {'Content-Type': undefined},
            data: formData,
            withCredentials: true
        };
    
        $http(req).then(function(response) {
            console.log(response);
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Product has been added successfully'
            });
            categCtrl.fetchProducts({id: categCtrl.currentCategoryId});
            categCtrl.newProduct = {};
        }, function(error) {
            console.error('Error adding product:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to add product!'
            });
        });
    };


    categCtrl.deleteCategory = function(categoryId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
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
                    Swal.fire(
                        'Deleted!',
                        'Category has been deleted successfully.',
                        'success'
                    );
                    categCtrl.fetchCategories();
                }, function(error) {
                    console.error('Error deleting category:', error);
                    Swal.fire(
                        'Failed!',
                        'Failed to delete category!',
                        'error'
                    );
                });
            }
        });
    };

    categCtrl.deleteProduct = function(productId, categoryId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                var req = {
                    method: 'DELETE',
                    url: `${baseUrl}/store-app/products/delete/`,
                    withCredentials: true,
                    data: {
                        "category_id": categoryId,
                        "product_id": productId
                    }
                };
                $http(req).then(function(response) {
                    console.log(response);
                    Swal.fire(
                        'Deleted!',
                        'Product has been deleted successfully.',
                        'success'
                    );
                    categCtrl.fetchProducts({id: categCtrl.currentCategoryId});
                }, function(error) {
                    console.error('Error deleting product:', error);
                    Swal.fire(
                        'Failed!',
                        'Failed to delete product!',
                        'error'
                    );
                });
            }
        });
    };

    categCtrl.fetchCategories();
}]); 

chichub.controller('ProdViewController', ['$http', '$stateParams', '$state', function($http, $stateParams, $state) {
    var prodViewCtrl = this;
    prodViewCtrl.product = $stateParams.product || {};

    prodViewCtrl.getImageUrl = function(imagePath) {
        return baseUrl + '/media/' + imagePath;
    };

    prodViewCtrl.addToCart = function() {
        var req = {
            method: 'POST',
            url: `${baseUrl}/store-app/add-to-cart/`,
            withCredentials: true,
            data: {
                "product_id": prodViewCtrl.product.id,
                "quantity": 1  
            }
        };
        $http(req).then(function(response) {
            console.log('Product added to cart:', response);
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Product added to cart successfully!',
            });
        }, function(error) {
            console.error('Error adding product to cart:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to add product to cart. Please try again!',
            });
        });
    };
}]);

chichub.controller('CartController', ['$http', '$state', '$window', function($http, $state, $window) {
    var cartCtrl = this;
    cartCtrl.cartDetails = null;
    cartCtrl.cartItems = [];
    cartCtrl.total = 0;

    cartCtrl.getImageUrl = function(imagePath) {
        return baseUrl + '/media/' + imagePath;
    };

    cartCtrl.fetchCart = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/cart-details/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log(response);
            cartCtrl.cartDetails = response.data.Cart_Details;
            cartCtrl.processCartItems();
            cartCtrl.total = cartCtrl.cartDetails.estimated_price;
        }, function(error) {
            console.error('Error fetching cart:', error);
            Swal.fire(
                'Error',
                'Failed to fetch cart details. Please try again.',
                'error'
            );
        });
    };

    cartCtrl.processCartItems = function() {
        cartCtrl.cartItems = [];
        for (var productName in cartCtrl.cartDetails.detailed_product_list) {
            var item = cartCtrl.cartDetails.detailed_product_list[productName];
            item.name = productName;
            cartCtrl.cartItems.push(item);
        }
    };

    cartCtrl.updateQuantity = function(item) {
        var req = {
            method: 'PUT',
            url: `${baseUrl}/store-app/update-cart-quantity/`,
            withCredentials: true,
            data: {
                "product_id": item.id,
                "quantity": item.quantity
            },
            headers: {
                'Content-Type': 'application/json'
            }
        };
        $http(req).then(function(response) {
            console.log('Quantity updated successfully:', response);
            cartCtrl.fetchCart();
            Swal.fire(
                'Success',
                'Quantity updated successfully',
                'success'
            );
        }, function(error) {
            console.error('Error updating quantity:', error);
            Swal.fire(
                'Failed!',
                'Failed to update quantity. Please try again.',
                'error'
            );
        });
    };

    cartCtrl.removeItem = function(item) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                var req = {
                    method: 'DELETE',
                    url: `${baseUrl}/store-app/remove-from-cart/`,
                    withCredentials: true,
                    data: {
                        "product_id": item.id
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                $http(req).then(function(response) {
                    console.log('Item removed successfully:', response);
                    cartCtrl.fetchCart();
                    Swal.fire(
                        'Deleted!',
                        'The item has been removed from your cart.',
                        'success'
                    );
                }, function(error) {
                    console.error('Error removing item from cart:', error);
                    Swal.fire(
                        'Failed!',
                        'Failed to remove item from cart. Please try again.',
                        'error'
                    );
                });
            }
        });
    };

    cartCtrl.fetchCart();
}]);

chichub.controller('FrontController', ['$http', '$state', function($http, $state) {
    var frontCtrl = this;
    frontCtrl.email = sessionStorage.getItem('email');
    frontCtrl.categories = [];
    frontCtrl.allProducts = []; 
    frontCtrl.products = [];
    frontCtrl.currentCategoryId = null;
    frontCtrl.currentCategoryName = null;
    frontCtrl.searchQuery = ''; 
    frontCtrl.searchResults = [];
    frontCtrl.showSearchResults = false;

    frontCtrl.logout = function() {
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of your account.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, log out!'
        }).then((result) => {
            if (result.isConfirmed) {
                var req = {
                    method: 'POST',
                    url: `${baseUrl}/accounts/logout/`,
                    withCredentials: true
                };
                $http(req).then(function(response) {
                    console.log(response);
                    sessionStorage.removeItem('email');
                    Swal.fire(
                        'Logged Out!',
                        'You have been successfully logged out.',
                        'success'
                    ).then(() => {
                        $state.go('login');
                    });
                }, function(error) {
                    console.log("error", error);
                    Swal.fire(
                        'Error',
                        'Failed to log out. Please try again.',
                        'error'
                    );
                });
            }
        });
    };
    
    frontCtrl.fetchProducts = function(category) {
        var req = {
            method: 'POST',
            url: `${baseUrl}/store-app/products/`,
            data: {
                "category_id": category.id
            },
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log(response);
            frontCtrl.products = response.data.Product_Details; 
        }, function(error) {
            console.error('Error fetching products:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to fetch products. Please try again!',
            });
        });
    };

    frontCtrl.addToCart = function(product) {
        var req = {
            method: 'POST',
            url: `${baseUrl}/store-app/add-to-cart/`,
            data: {
                "product_id": product.id,
                "category_id": frontCtrl.currentCategoryId
            },
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log('Product added to cart:', response);
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Product added to cart successfully!',
            });
        }, function(error) {
            console.error('Error adding product to cart:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to add product to cart. Please try again!',
            });
        });
    };

    frontCtrl.fetchCategories = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/categories/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log(response);
            frontCtrl.categories = response.data.Category_Details;
        }, function(error) {
            console.error('Error fetching categories:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to fetch categories. Please try again!',
            });
        });
    };

    frontCtrl.getImageUrl = function(imagePath) {
        return baseUrl + '/media/' + imagePath;
    };

    frontCtrl.fetchAllProducts = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/all-products/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            frontCtrl.allProducts = response.data.All_Products;
            console.log('All products fetched:', frontCtrl.allProducts);
        }, function(error) {
            console.error('Error fetching all products:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to fetch products. Please try again!',
            });
        });
    };

    frontCtrl.search = function() {
        if (frontCtrl.searchQuery.length > 0) {
            frontCtrl.searchResults = frontCtrl.allProducts.filter(function(product) {
                return product.product_name.toLowerCase().includes(frontCtrl.searchQuery.toLowerCase()) ||
                       (product.description && product.description.toLowerCase().includes(frontCtrl.searchQuery.toLowerCase()));
            });
            frontCtrl.showSearchResults = true;
        } else {
            frontCtrl.searchResults = [];
            frontCtrl.showSearchResults = false;
        }
    };

    frontCtrl.clearSearch = function() {
        frontCtrl.searchQuery = '';
        frontCtrl.searchResults = [];
        frontCtrl.showSearchResults = false;
    };

    frontCtrl.fetchCategories();
    frontCtrl.fetchAllProducts();

}]);

chichub.controller('FrontController', ['$http', '$state', function($http, $state) {
    var mainCtrl = this;
    mainCtrl.products = []; 
    mainCtrl.searchQuery = ''; 
    mainCtrl.searchResults = [];

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

    mainCtrl.getImageUrl = function(imagePath) {
        return baseUrl + '/media/' + imagePath;
    };

    mainCtrl.fetchAllProducts = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/products/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            frontCtrl.products = response.data.Product_Details;
        }, function(error) {
            console.error('Error fetching products:', error);
        });
    };

    mainCtrl.search = function() {
        if (mainCtrl.searchQuery.length > 0) {
            mainCtrl.searchResults = mainCtrl.products.filter(function(product) {
                return product.product_name.toLowerCase().includes(mainCtrl.searchQuery.toLowerCase()) ||
                       (product.description && product.description.toLowerCase().includes(mainCtrl.searchQuery.toLowerCase()));
            });
        } else {
            mainCtrl.searchResults = [];
        }
    };

}]);

chichub.controller('CheckoutController', ['$http', '$state', function($http, $state) {
    var checkoutCtrl = this;
    checkoutCtrl.cartItems = [];
    checkoutCtrl.total = 0;
    
    checkoutCtrl.orderDetails = {
        firstName: '',
        lastName: '',
        number: '',
        address: '',
        city: '',
        state: '',
        pin: '',
        paymentMethod: ''
    };

    checkoutCtrl.states = ['Uttar Pradesh', 'Assam', 'Uttarakhand', 'Mumbai','Bangalore','Bihar','Haryana']; 

    checkoutCtrl.placeOrder = function() {
        var orderData = {
            ...checkoutCtrl.orderDetails,
            cartItems: checkoutCtrl.cartItems,
            total: checkoutCtrl.total
        };

        var req = {
            method: 'POST',
            url: baseUrl + '/store-app/place-order/',
            withCredentials: true,
            data: orderData,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        $http(req).then(function(response) {
            console.log('Order placed successfully:', response);
            Swal.fire(
                'Success',
                'Your order has been placed successfully!',
                'success'
            ).then(() => {
                $state.go('orderSummary', { orderId: response.data.orderId });
            });
        }, function(error) {
            console.error('Error placing order:', error);
            Swal.fire(
                'Error',
                'Failed to place order. Please try again.',
                'error'
            );
        });
    };
    
    checkoutCtrl.fetchCartDetails();
}]);

