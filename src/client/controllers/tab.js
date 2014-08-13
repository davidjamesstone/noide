app.controller('TabCtrl', ['$scope', '$location', '$window', '$sce', '$modal', 'dialog',
  function($scope, $location, $window, $sce, $modal, $dialog) {

    var address = $location.search().address;

    $scope.address = address;
    $scope.model = {
      address: address
    };

    $scope.submit = function(e) {
      e.preventDefault();
      $scope.address = $sce.trustAsResourceUrl($scope.model.address);
    };

  }
]);
