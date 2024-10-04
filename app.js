const chichub = angular.module('chichub', ['ui.router']);
var baseUrl = 'https://10.21.96.33:8000';

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
        .state('main', {
            url: '/main',
            templateUrl: 'templateFiles/main.html',
            controller: 'MainController',
            controllerAs: 'mainCtrl'
        })
        .state('landing', {
            url: '/landing',
            templateUrl: 'templateFiles/landingPage.html',
            controller: 'LandingController',
            controllerAs: 'landingCtrl'
        })
        .state('orders', {
            url: '/orders',
            templateUrl: 'templateFiles/orderHist.html',
            controller: 'OrderHistoryController',
            controllerAs: 'ordersCtrl'
        })
        .state('checkout', {
            url: '/checkout',
            templateUrl: 'templateFiles/checkout.html',
            controller: 'CheckoutController',
            controllerAs: 'checkoutCtrl'
        })
        .state('order', {
            url: '/order',
            templateUrl: 'templateFiles/orders.html',
            controller: 'OrderController',
            controllerAs: 'orderCtrl'
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
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Registration successful'
            }).then(() => {
                $state.go('login');
            });
        }, function(error) {
            regCtrl.errorMessage = error.data.message || "An unexpected error occurred. PLease try again!!!";
            console.log("error", error);
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: regCtrl.errorMessage
            });
        });
    };
}]);

chichub.controller('LoginController', ['$http', '$state', function ($http, $state) {
    var loginCtrl = this;
    loginCtrl.email = '';
    loginCtrl.password = '';
    
    loginCtrl.checkSession = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/accounts/login/`,
            withCredentials: true
        };

        $http(req).then(function(response) {
            console.log("Session check response:", response);
            if (response.data.message === "Super user is already logged in") {
                $state.go('admin');
            } else if (response.data.message === "Normal user is already logged in") {
                $state.go('main');
            }
        }, function(error) {
            console.log("Session check failed", error);
        });
    };

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
                    sessionStorage.setItem('email', loginCtrl.email);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Superuser login successful'
                    }).then(() => {
                        $state.go('admin');
                    });
                } else {
                    sessionStorage.setItem('email', loginCtrl.email);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'User Login Successful'
                    }).then(() => {
                        $state.go('landing');
                    });
                }
            }, function(error) { 
                console.log("error", error);
                loginCtrl.errorMessage = error.data.message || "An unexpected error occurred";
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: loginCtrl.errorMessage
                });
            });
        } else {
            loginCtrl.errorMessage = "Please enter both email and password.";
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: loginCtrl.errorMessage
            });
        }
    };
    loginCtrl.checkSession();
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
            if(error.data.message==="Super user login is required !!!"){
                Swal.fire(
                    'Error',
                    error.data.message,
                    'error'
                );
                $state.go('login');
            } else {
                Swal.fire(
                    'Error',
                    error.data.message,
                    'error'
                );
            }
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
                        error.data.message || 'Failed to make user an admin!',
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
                        error.data.message || 'You cannot delete the OWNER!',
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
                        error.data.message || 'Failed to log out. Please try again!',
                        'error'
                    );
                });
            }
        });
    };

    admCtrl.fetchUsers();
}]);

chichub.controller('MainController', ['$http','$state', function($http,$state) {
    var mainCtrl = this;
    mainCtrl.categories = [];
    mainCtrl.products = [];
    mainCtrl.currentCategoryId = null;
    mainCtrl.currentCategoryName = null;
    mainCtrl.allProducts = []; 
    mainCtrl.searchQuery = ''; 
    mainCtrl.searchResults = [];
    mainCtrl.isLoggedIn = false;
    mainCtrl.loading = true;

    mainCtrl.checkLoginStatus = function() {
        mainCtrl.isLoggedIn = !!sessionStorage.getItem('email');
    };

    mainCtrl.logout = function() {
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
                    mainCtrl.isLoggedIn = false; 
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
                        error.data.message || 'Failed to log out. Please try again.',
                        'error'
                    );
                });
            }
        });
    };

    mainCtrl.getImageUrl = function(imagePath) {
                return baseUrl + '/media/' + imagePath;
    };

    mainCtrl.fetchProducts = function(category) {
        mainCtrl.currentCategoryId = category.id;
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
                    mainCtrl.products = response.data.Product_Details; 
                }, function(error) {
                    console.error('Error fetching products:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: error.data.message || 'Failed to fetch products. Please try again!'   ,
                    });
                });
            };
        
            mainCtrl.addToCart = function(product) {
                var req = {
                    method: 'POST',
                    url: `${baseUrl}/store-app/add-to-cart/`,
                    data: {
                        "product_id": product.id
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
                        text:  error.data.message || 'Failed to add product to cart. Please try again!' ,
                    });
                });
            };

    mainCtrl.fetchCategories = function() {
        mainCtrl.loading = true;
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/categories/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            console.log(response);
            mainCtrl.categories = response.data.Category_Details;
            mainCtrl.loading = false;
        }, function(error) {
            console.error('Error fetching categories:', error);
            mainCtrl.loading = false;
            Swal.fire(
                'Error',
                error.data.message || 'Failed to fetch categories',
                'error'
            );
        });
    };

    mainCtrl.fetchAllProducts = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/all-products/`,
            withCredentials: true
        };
        $http(req).then(function(response) {
            mainCtrl.allProducts = response.data.Products_all;
            mainCtrl.search(); 
        }, function(error) {
            console.error('Error fetching products:', error);
        });
    };

    mainCtrl.search = function() {
        if (mainCtrl.searchQuery.length > 0) {
            mainCtrl.searchResults = mainCtrl.allProducts.filter(function(product) {
                return product.product_name.toLowerCase().includes(mainCtrl.searchQuery.toLowerCase()) ||
                       (product.description && product.description.toLowerCase().includes(mainCtrl.searchQuery.toLowerCase()));
            });
        } else {
            mainCtrl.searchResults = []; 
        }
    };

    mainCtrl.checkLoginStatus();
    mainCtrl.fetchAllProducts();
    mainCtrl.fetchCategories();
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
            document.getElementById('category-image').value = '';
        }, function(error) {
            console.error('Error adding category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.data.message || 'Failed to add category!'
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
            document.getElementById('product-image').value = '';
        }, function(error) {
            console.error('Error adding product:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.data.message || 'Failed to add product!'
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
                        'Failed',
                        error.data.message || 'Failed to delete category!',
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
                        'Failed',
                        error.data.message || 'Failed to delete product!',
                        'error'
                    );
                });
            }
        });
    };
    categCtrl.fetchCategories();
}]); 

chichub.controller('CartController', ['$http','$state', function($http,$state) {
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
                cartCtrl.total = cartCtrl.cartDetails.total_price;
            }, function(error) {
                console.error('Error fetching cart:', error);
                if(error.data.message==="Login is required !!!"){
                    Swal.fire(
                        'Error',
                        error.data.message,
                        'error'
                    );
                    $state.go('login');
                } else {
                    Swal.fire(
                        'Error',
                        error.data.message || 'Failed to fetch cart details. Please try again!',
                        'error'
                    );
                }
                
            });
       
    };

    cartCtrl.processCartItems = function() {
        cartCtrl.cartItems = [];
        for (var productName in cartCtrl.cartDetails.status) {
            var item = cartCtrl.cartDetails.status[productName];
            item.name = productName;
            cartCtrl.cartItems.push(item);
        }
    };

    cartCtrl.updateQuantity = function(item) {
        var req = {
            method: 'PATCH',
            url: `${baseUrl}/store-app/update-cart-details/`,
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
                error.data.message || 'Failed to update quantity. Please try again!',
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
                        error.data.message || 'Failed to remove item from cart. Please try again!',
                        'error'
                    );
                });
            }
        });
    };

    cartCtrl.fetchCart();
}]);

chichub.controller('CheckoutController', ['$http','$state', function($http,$state) {
    var checkoutCtrl = this;
    checkoutCtrl.cartItems = [];
    checkoutCtrl.total = 0;
    
    checkoutCtrl.orderDetails = {
        first_name: '',
        last_name: '',
        phone_number: '',
        address: '',
        city: '',
        state: '',
        pin_code: '',
        payment_method: ''
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
            url: `${baseUrl}/store-app/place-order/`,
            withCredentials: true,
            data: orderData,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        $http(req).then(function(response) {
            console.log('Order placed successfully:', response);
            var orderId = response.data.order_id;
            checkoutCtrl.orderDetails = {
                first_name: '',
                last_name: '',
                phone_number: '',
                address: '',
                city: '',
                state: '',
                pin_code: '',
                payment_method: ''
            };
            checkoutCtrl.cartItems = [];
            checkoutCtrl.total = 0;
            Swal.fire({
                title: 'Thank You!',
                html: `Your order has been placed successfully!<br>Your order ID is: <strong>${orderId}</strong>`,
                icon: 'success',
                confirmButtonText: 'OK'
            });
            $state.go('main');
        }, function(error) {
            console.error('Error placing order:', error);
            Swal.fire(
                'Error',
                error.data.message || 'Failed to place order. Please try again!',
                'error'
            );
        });
    };

    checkoutCtrl.fetchCart = function() {
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/cart-details/`,
            withCredentials: true
        };
        
        $http(req).then(function(response) {
            console.log(response);
            checkoutCtrl.cartDetails = response.data.Cart_Details;
            checkoutCtrl.total = checkoutCtrl.cartDetails.estimated_price;
            checkoutCtrl.cartItems = checkoutCtrl.cartDetails.items || [];
        }, function(error) {
            console.error('Error fetching cart:', error);
            Swal.fire(
                'Error',
                error.data.message || 'Failed to fetch cart details. Please try again!',
                'error'
            );
        });
    };

    checkoutCtrl.fetchCart();
}]);

chichub.controller('LandingController', ['$http','$state', function($http,$state) {
    var landingCtrl = this;
    landingCtrl.isLoggedIn = false;

    landingCtrl.checkLoginStatus = function() {
        landingCtrl.isLoggedIn = !!sessionStorage.getItem('email');
    };

    landingCtrl.logout = function() {
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
                    landingCtrl.isLoggedIn = false; 
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
                        error.data.message || 'Failed to log out. Please try again.',
                        'error'
                    );
                });
            }
        });
    };

    landingCtrl.checkLoginStatus();
}]); 

chichub.controller('OrderHistoryController', ['$http', function($http) {
    var ordersCtrl = this;
    ordersCtrl.orders = [];
    ordersCtrl.loading = true;
    ordersCtrl.error = null;

    ordersCtrl.fetchOrders = function() {
        ordersCtrl.loading = true;
        ordersCtrl.error = null;
        
        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/order-details/`,
            withCredentials: true
        };

        $http(req).then(function(response) {
            console.log(response);
            ordersCtrl.orders = response.data.Order_Details || [];
            ordersCtrl.loading = false;
        }, function(error) {
            console.log("Error", error);
            ordersCtrl.error = 'Failed to load orders.';
            ordersCtrl.loading = false;
            Swal.fire(
                'Error',
                error.data.message || 'Failed to fetch orders',
                'error'
            );
        });
    };

    ordersCtrl.fetchOrders();
}]);

chichub.controller('OrderController', ['$http', function($http) {
    var orderCtrl = this;
    orderCtrl.orders = [];

    orderCtrl.fetchOrders = function() {

        var req = {
            method: 'GET',
            url: `${baseUrl}/store-app/order-details/`,
            withCredentials: true
        };

        $http(req).then(function(response) {
            console.log(response);
            orderCtrl.orders = response.data.Order_Details || [];
        }, function(error) {
            console.log("Error", error);
            Swal.fire(
                'Error',
                error.data.message || 'Failed to fetch orders',
                'error'
            );
        });
    };

    orderCtrl.fetchOrders();
}]);