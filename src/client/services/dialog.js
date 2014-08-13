app.service('dialog', ['$modal', function($modal) {

  var service = {};

  service.alert = function(data) {

    return $modal.open({
      templateUrl: 'alert.html',
      controller: 'AlertCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message
          };
        }
      }
    }).result;

  };

  service.confirm = function(data) {

    return $modal.open({
      templateUrl: 'confirm.html',
      controller: 'ConfirmCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message
          };
        }
      }
    }).result;

  };

  service.prompt = function(data) {

    return $modal.open({
      templateUrl: 'prompt.html',
      controller: 'PromptCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message,
            defaultValue: data.defaultValue,
            placeholder: data.placeholder
          };
        }
      }
    }).result;

  };

  return service;

}]);

app.controller('AlertCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;

    $scope.ok = function () {
      $modalInstance.close();
    };
  }
]);

app.controller('ConfirmCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;

    $scope.ok = function () {
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
]);

app.controller('PromptCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;
    $scope.placeholder = data.placeholder;
    $scope.input = { value: data.defaultValue };

    $scope.ok = function () {
      $modalInstance.close($scope.input.value);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
]);
